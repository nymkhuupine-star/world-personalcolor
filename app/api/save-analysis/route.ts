import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { normalizeSubtypeKey, seasonKeyFromSeasonName } from '@/utils/reportPdfs';

export const runtime = 'nodejs';

// Service role key ашиглана — RLS bypass хийж, server-side-д л байна
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
      const seasonKey = seasonKeyFromSeasonName(result.season);
      const seasonFolder = seasonKey ?? result.season.toLowerCase();
      const subtypeKey = seasonKey ? normalizeSubtypeKey(seasonKey, result.subType) : null;

      const candidatePaths = [
        subtypeKey ? `${seasonFolder}/${subtypeKey}.pdf` : null,
        `${seasonFolder}.pdf`,
      ].filter(Boolean) as string[];

      let pdfUrl: string | undefined;
      for (const path of candidatePaths) {
        const { data: list } = await supabase.storage.from('reports').list(
          path.includes('/') ? path.split('/')[0] : '',
          { search: path.includes('/') ? path.split('/')[1] : path }
        );
        if (list && list.length > 0) {
          pdfUrl = supabase.storage.from('reports').getPublicUrl(path).data.publicUrl;
          break;
        }
      }

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
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    console.error('Save analysis error:', error);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
