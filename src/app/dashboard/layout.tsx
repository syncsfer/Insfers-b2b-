import { Sidebar } from '@/components/layout/sidebar';
import { SetupBanner } from '@/components/layout/setup-banner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="ml-[240px] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <SetupBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
