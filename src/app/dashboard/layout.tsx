import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="ml-[240px] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
