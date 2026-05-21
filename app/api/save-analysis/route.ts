import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AnalysisResult = {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  subType: string;
  reasoning: string;
  recommendedColors: string[];
};

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

    const body = await req.json();
    const { result, imageUrl } = body as { result: AnalysisResult; imageUrl: string };

    // Save to user_analyses
    const { error: dbError } = await supabase.from('user_analyses').insert({
      user_id: userId,
      email,
      season: result.season,
      sub_type: result.subType,
      reasoning: result.reasoning,
      recommended_colors: result.recommendedColors,
      image_path: imageUrl,
    });

    if (dbError) console.error('DB save error:', dbError);

    // Send email with PDF
    if (email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const pdfPath = join(process.cwd(), 'public', 'reports', `${result.season.toLowerCase()}.pdf`);
      let pdfBuffer: Buffer | undefined;
      try { pdfBuffer = await readFile(pdfPath); } catch { /* PDF байхгүй бол skip */ }

      await resend.emails.send({
        from: 'Personal Color AI <onboarding@resend.dev>',
        to: email,
        subject: 'Таны хувийн өнгөний оношлогоо бэлэн боллоо!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:24px;border-radius:12px">
            <h2>Сайн байна уу, ${user?.firstName ?? 'танд'}!</h2>
            <p>Таны хувийн өнгөний шинжилгээний үр дүн бэлэн боллоо.</p>
            <div style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #7c3aed">
              <p><strong>Таны улирал:</strong> ${SEASON_MN[result.season]} (${result.subType})</p>
              <p><strong>Тайлбар:</strong> ${result.reasoning}</p>
            </div>
            <p style="margin-top:16px">Дэлгэрэнгүй зөвлөмжийг хавсаргасан PDF файлаас үзнэ үү.</p>
            <hr style="margin:20px 0"/>
            <p style="font-size:12px;color:#888;text-align:center">© ${new Date().getFullYear()} Personal Color AI</p>
          </div>
        `,
        attachments: pdfBuffer
          ? [{ filename: `${result.season.toLowerCase()}_report.pdf`, content: pdfBuffer }]
          : [],
      });
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Save analysis error:', error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
