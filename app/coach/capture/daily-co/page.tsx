import { Metadata } from 'next';
import DailyTranscriptionDisplay from '../components/DailyTranscriptionDisplay';

export const metadata: Metadata = {
  title: 'Captura Daily.co - Transcrição Híbrida',
  description: 'Sistema de transcrição em tempo real usando Daily.co com backend Deepgram integrado',
};

export default function DailyCoCapturePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--raisin-black)' }}>
      <DailyTranscriptionDisplay />
    </main>
  );
} 