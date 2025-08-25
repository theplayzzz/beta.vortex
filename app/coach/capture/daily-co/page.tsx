import { Metadata } from 'next';
import DailyTranscriptionDisplay from '../components/DailyTranscriptionDisplay';

export const metadata: Metadata = {
  title: 'Captura Daily.co - Transcrição Híbrida',
  description: 'Sistema de transcrição em tempo real usando Daily.co com backend Deepgram integrado',
};

interface DailyCoCapturingPageProps {
  searchParams: { sessionId?: string };
}

export default function DailyCoCapturePage({ searchParams }: DailyCoCapturingPageProps) {
  const sessionId = searchParams.sessionId;

  return (
    <main className="h-full min-h-0" style={{ backgroundColor: 'var(--raisin-black)' }}>
      <DailyTranscriptionDisplay sessionId={sessionId} />
    </main>
  );
} 