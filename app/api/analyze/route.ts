// ─────────────────────────────────────────────────────────────────────────────
// /api/analyze — Personal Color Analysis
//
// Groq is used ONLY for:
//   1. Photo quality check (vision)
//   2. User-friendly reasoning text generation
//
// Season is determined by the Rule Engine on the client (never by AI).
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from 'openai';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import {
  type SeasonName,
  type ColorMetrics,
  SEASON_PALETTES,
  getBaseSeason,
  seasonNameToStoragePath,
} from '@/lib/personal-color/rule-engine';

export const runtime = 'nodejs';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = 'reports';

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

type PhotoQuality = { status: 'good' | 'bad'; issues: string[] };

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isHttpUrl(v: string) {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

// ── Groq: photo quality check (vision) ───────────────────────────────────────

async function checkPhotoQuality(dataUrl: string): Promise<PhotoQuality> {
  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    response_format: { type: 'json_object' },
    temperature: 0,   // deterministic — same photo → same verdict
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: dataUrl } },
        {
          type: 'text',
          text:
            'You are evaluating a photo for personal color analysis suitability.\n' +
            'Return ONLY a JSON object: { "status": "good" | "bad", "issues": string[] }\n\n' +
            'Check EACH of the following. If 2 or more fail → status: "bad".\n' +
            '1. Lighting: too dark or too dim?\n' +
            '2. Color cast: strong yellow, orange, or red artificial light on the face?\n' +
            '3. Filter/edit: heavily filtered, smoothed, or color-graded image?\n' +
            '4. Makeup: excessive makeup hiding natural skin tone?\n' +
            '5. Face visibility: face not fully visible or not centered?\n' +
            '6. Clarity: hair, eyes, and skin not clearly distinguishable?\n' +
            '7. Background reflection: strongly colored background reflecting onto the face?\n\n' +
            'Write issues[] in Mongolian (e.g. "Гэрэл хэт харанхуй байна"). Empty if status is good.',
        },
      ],
    }],
  });

  try {
    const parsed = JSON.parse(
      (completion.choices[0]?.message?.content ?? '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    ) as PhotoQuality;
    if (parsed.status !== 'good' && parsed.status !== 'bad') parsed.status = 'bad';
    if (!Array.isArray(parsed.issues)) parsed.issues = [];
    return parsed;
  } catch {
    return { status: 'good', issues: [] };
  }
}

// ── Groq: user-friendly reasoning text (text-only, fast) ─────────────────────

async function generateReasoning(
  seasonName: SeasonName,
  metrics: ColorMetrics,
  confidence: string,
): Promise<string> {
  const { undertone: u, value: v, chroma: c } = metrics;
  const dominant = (obj: Record<string, number>) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1])[0][0];

  const prompt =
    `You are a personal color consultant writing for a Mongolian user.\n` +
    `Their personal color season has been determined as: ${seasonName} (confidence: ${confidence}).\n` +
    `Key traits — undertone: ${dominant(u)}, value: ${dominant(v)}, chroma: ${dominant(c)}.\n\n` +
    `Write 2-3 warm, encouraging sentences in Mongolian explaining what their season means.\n` +
    `Do NOT mention numbers, scores, or technical terms. Be specific to ${seasonName}.`;

  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,  // low randomness — consistent tone, slight natural variation
    max_tokens: 200,
  });

  return (completion.choices[0]?.message?.content ?? '').trim();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { GROQ_API_KEY, RESEND_API_KEY } = process.env;
    if (!GROQ_API_KEY || !RESEND_API_KEY)
      return Response.json({ error: 'API keys missing.' }, { status: 500 });

    const body = await req.json() as {
      imageUrl: unknown;
      email: unknown;
      colorMetrics: unknown;
      seasonName: unknown;
      confidence: unknown;
    };

    const { imageUrl, email, colorMetrics, seasonName, confidence } = body;

    // Validate inputs
    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof imageUrl !== 'string' || !isHttpUrl(imageUrl))
      return Response.json({ error: 'Valid image URL required.' }, { status: 400 });
    if (!colorMetrics || typeof colorMetrics !== 'object')
      return Response.json({ error: 'colorMetrics required.' }, { status: 400 });
    if (typeof seasonName !== 'string' || !seasonName)
      return Response.json({ error: 'seasonName required.' }, { status: 400 });

    // 1. Fetch image → base64 (for quality check vision call)
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok)
      return Response.json({ error: 'Failed to fetch image.' }, { status: 502 });
    const mimeType = (imageRes.headers.get('content-type') ?? 'image/jpeg').split(';')[0].trim();
    const base64 = Buffer.from(await imageRes.arrayBuffer()).toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 2. Groq: photo quality check (vision)
    const photoQuality = await checkPhotoQuality(dataUrl);
    if (photoQuality.status === 'bad') {
      return Response.json({
        canAnalyze: false,
        message:
          'Зургийн гэрэл хангалтгүй байна. Илүү зөв хувийн өнгө тодорхойлохын тулд ' +
          'өдрийн байгалийн гэрэлд, makeup/filterгүй, нүүрээ бүтэн харагдуулсан зураг оруулна уу.',
        issues: photoQuality.issues,
      });
    }

    // 3. Season is already determined by Rule Engine on client — use it directly
    const season      = seasonName as SeasonName;
    const baseSeason  = getBaseSeason(season);
    const { folder, file: subtypeFile } = seasonNameToStoragePath(season);

    // 4. Groq: generate user-friendly reasoning (text only, not vision)
    const reasoning = await generateReasoning(
      season,
      colorMetrics as ColorMetrics,
      String(confidence ?? 'medium'),
    );

    // 5. Deterministic color palette — no AI involved
    const recommendedColors: string[] = SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring'];

    // 6. PDF URL from Supabase Storage
    const pdfPath = `${folder}/${subtypeFile}.pdf`;
    const { data: listed } = await supabase.storage.from(BUCKET).list(folder, { search: `${subtypeFile}.pdf` });
    const pdfUrl = listed?.length
      ? supabase.storage.from(BUCKET).getPublicUrl(pdfPath).data.publicUrl
      : null;

    // 7. Send email
    const resend = new Resend(RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: 'Personal Color AI <onboarding@resend.dev>',
      to: email,
      subject: 'Таны хувийн өнгөний оношлогоо бэлэн боллоо!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:24px;border-radius:12px">
          <h2 style="color:#333">Сайн байна уу?</h2>
          <p>Таны хувийн өнгөний шинжилгээний үр дүн бэлэн боллоо.</p>
          <div style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #7c3aed">
            <p><strong>Таны улирал:</strong> ${SEASON_MN[baseSeason]} (${season})</p>
            <p><strong>Тайлбар:</strong> ${reasoning}</p>
          </div>
          ${pdfUrl ? `
          <div style="margin-top:20px;text-align:center">
            <a href="${pdfUrl}" target="_blank"
              style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
              📄 PDF тайланг үзэх
            </a>
          </div>` : ''}
          <hr style="margin:20px 0"/>
          <p style="font-size:12px;color:#888;text-align:center">© ${new Date().getFullYear()} Personal Color AI</p>
        </div>
      `,
      attachments: [],
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return Response.json({ error: 'Failed to send email.', message: emailError.message }, { status: 502 });
    }

    // 8. Save to analyses table
    await supabase.from('analyses').insert({
      email,
      image_path: imageUrl,
      season: baseSeason,
      sub_type: season,
      email_sent: true,
      paid: false,
    });

    // 9. Return result (season was decided by Rule Engine, not AI)
    return Response.json({
      canAnalyze: true,
      message: 'Зураг шаардлага хангаж байна. Таны хувийн өнгийг тодорхойлж байна…',
      season: baseSeason,
      subType: season,
      reasoning,
      recommendedColors,
      confidence,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error.', message: msg }, { status: 500 });
  }
}
