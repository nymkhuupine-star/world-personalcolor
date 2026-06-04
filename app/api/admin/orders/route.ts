import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email || email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL)
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('analysis_orders')
    .select('id, email, analysis_result, invoice_id, amount, paid, paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
