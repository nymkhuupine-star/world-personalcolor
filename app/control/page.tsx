import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Dashboard from './Dashboard';
import AdminLogin from './AdminLogin';

export default async function ControlPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || token !== secret) {
    return <AdminLogin />;
  }

  return <Dashboard />;
}
