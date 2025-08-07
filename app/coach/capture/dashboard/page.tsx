import { Metadata } from 'next';
import TranscriptionDashboard from './components/TranscriptionDashboard';

export const metadata: Metadata = {
  title: 'Dashboard de Transcrição - Vortex',
  description: 'Painel principal para gerenciar e acompanhar suas sessões de transcrição',
};

export default function TranscriptionDashboardPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#1a1b1e', color: '#f0f0f0' }}>
      <TranscriptionDashboard />
    </main>
  );
}
