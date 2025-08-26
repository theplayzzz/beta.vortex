import { Metadata } from 'next';
import DailyTranscriptionDisplay from '../components/DailyTranscriptionDisplay';

export const metadata: Metadata = {
  title: 'Captura Daily.co - Transcrição Híbrida',
  description: 'Sistema de transcrição em tempo real usando Daily.co com backend Deepgram integrado',
};

interface DailyCoCapturingPageProps {
  searchParams: Promise<{ sessionId?: string }>;
}

export default async function DailyCoCapturePage({ searchParams }: DailyCoCapturingPageProps) {
  const { sessionId } = await searchParams;

  return (
    <main className="h-full min-h-0" style={{ backgroundColor: 'var(--raisin-black)' }}>
      <DailyTranscriptionDisplay sessionId={sessionId} />
    </main>
  );
} 