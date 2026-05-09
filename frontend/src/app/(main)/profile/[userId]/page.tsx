import { ProfileView } from '@/components/profile/ProfileView';

interface Props {
  params: { userId: string };
}

export default function UserProfilePage({ params }: Props) {
  return <ProfileView userId={params.userId} />;
}