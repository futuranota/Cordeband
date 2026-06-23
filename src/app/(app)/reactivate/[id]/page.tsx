import { notFound, redirect } from 'next/navigation';
import { ReactivateScreen } from '@/components/screens/ReactivateScreen';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reactivar canción — Cordeband' };

type ReactivatePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReactivatePage({ params }: ReactivatePageProps) {
  const { id: songId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: song } = await supabase
    .from('songs')
    .select('id, title, user_id, is_featured')
    .eq('id', songId)
    .single();

  if (!song || song.user_id !== user.id || song.is_featured) {
    notFound();
  }

  return <ReactivateScreen songId={song.id} songTitle={song.title} />;
}
