import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { auth0 } from '@/lib/auth0';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The proxy already gates /dashboard/*; this is a second check so the layout
  // never renders without a session even if the matcher changes.
  const session = await auth0.getSession();

  if (!session) {
    redirect('/auth/login?returnTo=%2Fdashboard');
  }

  const { name, email, picture } = session.user;

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        user={{
          name: typeof name === 'string' ? name : null,
          email: typeof email === 'string' ? email : null,
          picture: typeof picture === 'string' ? picture : null,
        }}
      />
      <main className="ml-[240px] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
