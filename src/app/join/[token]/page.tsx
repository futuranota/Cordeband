import { JoinScreen } from '@/components/screens/JoinScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Unirse a la sala — Cordeband' };

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  return <JoinScreen token={token} />;
}
