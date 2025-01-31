import { DashboardNav } from '@/components/navigation/DashboardNav';
import { styles } from '@/utils/constants';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen ${styles.darkBg}`}>
      <DashboardNav />
      <div className="pt-20 px-4">
        {children}
      </div>
    </div>
  );
} 