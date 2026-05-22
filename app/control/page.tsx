import { auth, currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import Dashboard from './Dashboard';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default async function ControlPage() {
  const { userId } = await auth();

  if (!userId) {
    notFound();
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (!email || email !== ADMIN_EMAIL) {
    notFound();
  }

  return <Dashboard />;
}
