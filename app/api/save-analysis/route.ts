import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

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

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? '';

    const body = await req.json();
    const { result, imageUrl } = body as { result: AnalysisResult; imageUrl: string };

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

    return Response.json({ success: true });
  } catch (error: unknown) {
    console.error('Save analysis error:', error);
    return Response.json({ error: 'Дотоод алдаа гарлаа.' }, { status: 500 });
  }
}
