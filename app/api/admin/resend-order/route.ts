import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  type SeasonName,
  SEASON_PALETTES,
  getBaseSeason,
  seasonNameToStoragePath,
} from '@/lib/personal-color/rule-engine';
import { SEASON_DESCRIPTIONS } from '@/lib/personal-color/season-descriptions';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SEASON_MN: Record<string, string> = {
  Spring: 'Хавар', Summer: 'Зун', Autumn: 'Намар', Winter: 'Өвөл',
};

type StoredAnalysis = { seasonName: string; imageUrl?: string };

export async function POST(req: Request) {
  // Admin-only: requires NEXT_PUBLIC_ADMIN_EMAIL check via secret header
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { invoiceId?: string; orderId?: string };
  const { invoiceId, orderId } = body;

  if (!invoiceId && !orderId)
    return Response.json({ error: 'invoiceId эсвэл orderId шаардлагатай.' }, { status: 400 });

  const query = supabase
    .from('analysis_orders')
    .select('id, email, analysis_result, paid, paid_at');

  const { data: order, error } = invoiceId
    ? await query.eq('invoice_id', invoiceId).single()
    : await query.eq('id', orderId).single();

  if (error || !order)
    return Response.json({ error: 'Order олдсонгүй.' }, { status: 404 });

  const stored = order.analysis_result as StoredAnalysis | null;
  if (!stored?.seasonName || !order.email)
    return Response.json({ error: 'analysis_result эсвэл email байхгүй.' }, { status: 400 });

  try {
    await deliverResult(order.email, stored.seasonName, stored.imageUrl ?? null);

    // Mark paid if not already
    if (!order.paid) {
      await supabase
        .from('analysis_orders')
        .update({ paid: true, paid_at: new Date().toISOString() })
        .eq('id', order.id);
    }

    return Response.json({ success: true, email: order.email, season: stored.seasonName });
  } catch (err) {
    console.error('resend-order error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

async function deliverResult(email: string, seasonName: string, imageUrl: string | null) {
  const season            = seasonName as SeasonName;
  const baseSeason        = getBaseSeason(season);
  const reasoning         = SEASON_DESCRIPTIONS[season] ?? SEASON_DESCRIPTIONS['True Spring'];
  const recommendedColors = (SEASON_PALETTES[season] ?? SEASON_PALETTES['True Spring']) as string[];

  const { folder, file: subtypeFile } = seasonNameToStoragePath(season);
  const pdfPath = `${folder}/${subtypeFile}.pdf`;
  const { data: listed } = await supabase.storage
    .from('reports')
    .list(folder, { search: `${subtypeFile}.pdf` });
  const pdfUrl = listed?.length
    ? supabase.storage.from('reports').getPublicUrl(pdfPath).data.publicUrl
    : null;

  const { data: existing } = await supabase
    .from('analyses')
    .select('id')
    .eq('email', email)
    .eq('sub_type', season)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!existing) {
    await supabase.from('analyses').insert({
      email,
      image_path:         imageUrl,
      season:             baseSeason,
      sub_type:           season,
      reasoning,
      recommended_colors: recommendedColors,
      email_sent:         false,
      paid:               true,
    });
  }

  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY тохируулаагүй байна.');

  const resend = new Resend(RESEND_API_KEY);
  const { error: emailErr } = await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL ?? 'Personal Color AI <noreply@personalcolor.mn>',
    to:      email,
    subject: 'Таны хувийн өнгөний оношлогоо бэлэн боллоо!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:24px;border-radius:12px">
        <h2 style="color:#333">Сайн байна уу?</h2>
        <p>Таны хувийн өнгөний шинжилгээний үр дүн бэлэн боллоо.</p>
        <div style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #7c3aed">
          <p><strong>Таны улирал:</strong> ${SEASON_MN[baseSeason] ?? baseSeason} (${season})</p>
          <p><strong>Тайлбар:</strong> ${reasoning}</p>
        </div>
        ${pdfUrl ? `
        <div style="margin-top:20px;text-align:center">
          <a href="${pdfUrl}" target="_blank"
            style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            PDF тайланг үзэх
          </a>
        </div>` : ''}
        <hr style="margin:20px 0"/>
        <p style="font-size:12px;color:#888;text-align:center">© ${new Date().getFullYear()} Personal Color AI</p>
      </div>
    `,
  });

  if (emailErr) throw new Error(`Resend error: ${JSON.stringify(emailErr)}`);

  if (existing?.id) {
    await supabase.from('analyses').update({ email_sent: true }).eq('id', existing.id);
  }
}
