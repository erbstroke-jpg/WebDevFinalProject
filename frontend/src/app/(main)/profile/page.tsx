'use client';

import { useAuthStore } from '@/store/authStore';
import { ProfileView } from '@/components/profile/ProfileView';

export default function MyProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;
  return <ProfileView userId={user.id} />;
}