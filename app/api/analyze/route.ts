import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

// --- TYPES ---
type AnalyzeRequestBody = {
  email?: unknown;
  imageUrl?: unknown;
};

type PersonalColorAnalysis = {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  subType: string;
  reasoning: string;
  recommendedColors: string[];
};

type PublicApiError = {
  status: number;
  message: string;
};

// --- CONFIG & HELPERS ---
function publicError(status: number, message: string): PublicApiError {
  return { status, message };
}

const SYSTEM_PROMPT =
  "You are a professional Personal Color Consultant. Analyze the image and return ONLY a valid JSON object (no markdown, no code fences, no extra text) with keys: 'season' (Spring, Summer, Autumn, or Winter), 'subType', 'reasoning' (in Mongolian), and 'recommendedColors' (3-4 HEX codes). Ensure the JSON is strictly parseable.";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function safeJsonParse<T>(value: string): { ok: true; data: T } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(value) as T };
  } catch {
    return { ok: false };
  }
}

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function validatePersonalColorAnalysis(value: unknown): value is PersonalColorAnalysis {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  if (data.season !== 'Spring' && data.season !== 'Summer' && data.season !== 'Autumn' && data.season !== 'Winter') return false;
  if (typeof data.subType !== 'string' || data.subType.trim().length === 0) return false;
  if (typeof data.reasoning !== 'string' || data.reasoning.trim().length === 0) return false;
  if (!Array.isArray(data.recommendedColors)) return false;
  if (data.recommendedColors.length < 3 || data.recommendedColors.length > 4) return false;
  if (!data.recommendedColors.every((color) => typeof color === 'string' && isHexColor(color))) return false;
  return true;
}

async function imageUrlToInlineDataPart(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw publicError(502, `Failed to fetch image. Status: ${response.status}`);
  const contentType = response.headers.get('content-type') ?? 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();
  const buffer = await response.arrayBuffer();
  return {
    inlineData: {
      data: Buffer.from(buffer).toString('base64'),
      mimeType,
    },
  };
}

function getReportPdfPath(season: PersonalColorAnalysis['season']) {
  return join(process.cwd(), 'public', 'reports', `${season.toLowerCase()}.pdf`);
}

function buildEmailHtml(season: string, subType: string, reasoning: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #333;">Сайн байна уу?</h2>
      <p>Таны хувийн өнгөний шинжилгээний үр дүн бэлэн боллоо.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">
        <p><strong>Таны улирал:</strong> ${season} (${subType})</p>
        <p><strong>Тайлбар:</strong> ${reasoning}</p>
      </div>
      <p style="margin-top: 20px;">Дэлгэрэнгүй зөвлөмжийг хавсаргасан PDF файлаас үзнэ үү.</p>
      <hr style="margin: 20px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} Personal Color AI</p>
    </div>
  `;
}

// --- MAIN POST HANDLER ---
export async function POST(request: Request) {
  try {
    const { GEMINI_API_KEY, RESEND_API_KEY } = process.env;
    if (!GEMINI_API_KEY || !RESEND_API_KEY) {
      return Response.json({ error: 'API keys are missing.' }, { status: 500 });
    }

    const body = (await request.json()) as AnalyzeRequestBody;
    const { email, imageUrl } = body;

    // 1. Validation
    if (typeof email !== 'string' || !isEmail(email)) return Response.json({ error: 'Valid email is required.' }, { status: 400 });
    if (typeof imageUrl !== 'string' || !isHttpUrl(imageUrl)) return Response.json({ error: 'Valid image URL is required.' }, { status: 400 });

    // 2. Gemini Analysis
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const imagePart = await imageUrlToInlineDataPart(imageUrl);
    const result = await model.generateContent([
      'Analyze this face image and return ONLY JSON.',
      imagePart,
    ]);
    const responseText = result.response.text();

    const parsed = safeJsonParse<PersonalColorAnalysis>(responseText);
    if (!parsed.ok || !validatePersonalColorAnalysis(parsed.data)) {
      return Response.json({ error: 'AI returned invalid JSON.', raw: responseText }, { status: 502 });
    }

    const analysis = parsed.data;

    // 3. Read PDF Report
    const reportPath = getReportPdfPath(analysis.season);
    let pdfBuffer;
    try {
      pdfBuffer = await readFile(reportPath);
    } catch (err) {
      console.error('PDF file not found:', reportPath, err);
    }

    // 4. Send Email via Resend
    const resend = new Resend(RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from: 'Personal Color AI <onboarding@resend.dev>',
      to: email,
      subject: 'Таны хувийн өнгөний оношлогоо бэлэн боллоо!',
      html: buildEmailHtml(analysis.season, analysis.subType, analysis.reasoning),
      attachments: pdfBuffer ? [
        {
          filename: `${analysis.season.toLowerCase()}_report.pdf`,
          content: pdfBuffer,
        }
      ] : [],
    });

    if (emailError) {
      console.error('Resend Error:', emailError);
      return Response.json({ error: 'Failed to send email.', message: emailError.message }, { status: 502 });
    }

    return Response.json(analysis);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal server error.', message: error.message }, { status: 500 });
  }
}
