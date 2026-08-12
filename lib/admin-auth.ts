import { auth, currentUser } from '@clerk/nextjs/server';

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminUser(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const emails = adminEmails();
  if (emails.length === 0) return false;

  const user = await currentUser();
  const userEmails = user?.emailAddresses.map((e) => e.emailAddress.toLowerCase()) ?? [];
  return userEmails.some((e) => emails.includes(e));
}

/** Returns a 401 Response if the current Clerk session isn't an admin, otherwise null. */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAdminUser()) return null;
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
