import OpenAI from 'openai';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PersonalColorAnalysis = {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  subType: string;
  reasoning: string;
  recommendedColors: string[];
};

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isHttpUrl(v: string) {
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

function isHexColor(v: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
}

function validateAnalysis(v: unknown): v is PersonalColorAnalysis {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  if (!['Spring', 'Summer', 'Autumn', 'Winter'].includes(d.season as string)) return false;
  if (typeof d.subType !== 'string' || !d.subType.trim()) return false;
  if (typeof d.reasoning !== 'string' || !d.reasoning.trim()) return false;
  if (!Array.isArray(d.recommendedColors)) return false;
  if (d.recommendedColors.length < 3 || d.recommendedColors.length > 4) return false;
  if (!d.recommendedColors.every((c) => typeof c === 'string' && isHexColor(c))) return false;
  return true;
}

export async function POST(req: Request) {
  try {
    const { GROQ_API_KEY, RESEND_API_KEY } = process.env;
    if (!GROQ_API_KEY || !RESEND_API_KEY) {
      return Response.json({ error: 'API keys missing.' }, { status: 500 });
    }

    const body = await req.json();
    const { imageUrl, email } = body as { imageUrl: unknown; email: unknown };

    if (typeof email !== 'string' || !isEmail(email))
      return Response.json({ error: 'Зөв имэйл хаяг оруулна уу.' }, { status: 400 });
    if (typeof imageUrl !== 'string' || !isHttpUrl(imageUrl))
      return Response.json({ error: 'Valid image URL required.' }, { status: 400 });

    // 1. Fetch image → base64
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok)
      return Response.json({ error: 'Failed to fetch image.' }, { status: 502 });
    const mimeType = (imageRes.headers.get('content-type') ?? 'image/jpeg').split(';')[0].trim();
    const base64 = Buffer.from(await imageRes.arrayBuffer()).toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 2. AI Analysis
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          {
            type: 'text',
            text: 'You are a professional Personal Color Consultant. Analyze this face image and return ONLY a JSON object: "season" (Spring/Summer/Autumn/Winter), "subType" (string), "reasoning" (Mongolian), "recommendedColors" (3-4 HEX strings). No extra text.',
          },
        ],
      }],
    });

    const rawText = completion.choices[0]?.message?.content ?? '';
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let analysis: unknown;
    try { analysis = JSON.parse(cleaned); }
    catch { return Response.json({ error: 'AI returned invalid JSON.', raw: rawText }, { status: 502 }); }

    if (!validateAnalysis(analysis))
      return Response.json({ error: 'AI response failed validation.', raw: rawText }, { status: 502 });

    // 3. Read PDF
    const pdfPath = join(process.cwd(), 'public', 'reports', `${analysis.season.toLowerCase()}.pdf`);
    let pdfBuffer: Buffer | undefined;
    try { pdfBuffer = await readFile(pdfPath); } catch { /* PDF байхгүй бол skip */ }

    // 4. Send email
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
            <p><strong>Таны улирал:</strong> ${SEASON_MN[analysis.season]} (${analysis.subType})</p>
            <p><strong>Тайлбар:</strong> ${analysis.reasoning}</p>
          </div>
          <p style="margin-top:16px">Дэлгэрэнгүй зөвлөмжийг хавсаргасан PDF файлаас үзнэ үү.</p>
          <hr style="margin:20px 0"/>
          <p style="font-size:12px;color:#888;text-align:center">© ${new Date().getFullYear()} Personal Color AI</p>
        </div>
      `,
      attachments: pdfBuffer
        ? [{ filename: `${analysis.season.toLowerCase()}_report.pdf`, content: pdfBuffer }]
        : [],
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return Response.json({ error: 'Failed to send email.', message: emailError.message }, { status: 502 });
    }

    // 5. Save to analyses table (anonymous record)
    await supabase.from('analyses').insert({
      email,
      image_path: imageUrl,
      season: analysis.season,
      sub_type: analysis.subType,
      email_sent: true,
      paid: false,
    });

    return Response.json(analysis);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error.', message: msg }, { status: 500 });
  }
}
