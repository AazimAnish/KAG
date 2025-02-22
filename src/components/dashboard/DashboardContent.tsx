import { User } from '@/types/auth';
import { styles } from '@/utils/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

interface DashboardContentProps {
  user: User | null;
}

export const DashboardContent = ({ user }: DashboardContentProps) => {
  if (!user) return null;

  const formatValue = (key: string, value: number): string => {
    switch (key) {
      case 'height':
        return `${value} cm`;
      case 'weight':
        return `${value} kg`;
      default:
        return `${value} cm`;
    }
  };

  return (
    <main className="container mx-auto px-4 pt-24">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
          <CardHeader>
            <CardTitle className={styles.primaryText}>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.avatar_url && (
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <Image
                      src={user.avatar_url}
                      alt={user.name || 'Profile'}
                      fill
                      className="rounded-full object-cover border-2 border-[#D98324 ]/30"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className={styles.secondaryText}>Name: {user.name || 'Not set'}</p>
                <p className={styles.secondaryText}>Email: {user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
          <CardHeader>
            <CardTitle className={styles.primaryText}>Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.measurements && Object.entries(user.measurements).map(([key, value]) => (
                <p key={key} className={styles.secondaryText}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}: {formatValue(key, value)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
          <CardHeader>
            <CardTitle className={styles.primaryText}>Style Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={styles.secondaryText}>
                Body Type: {user.bodyType ? user.bodyType.charAt(0).toUpperCase() + user.bodyType.slice(1) : 'Not set'}
              </p>
              <p className={styles.secondaryText}>
                Gender: {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}; 