export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1A1A19]">
      <main className="pt-24">
        {children}
      </main>
    </div>
  );
} 