import { Metadata } from 'next';
import PreSessionDashboard from './components/PreSessionDashboard';

export const metadata: Metadata = {
  title: 'Configuração da Sessão - Vortex',
  description: 'Configure sua sessão de transcrição antes de começar. Defina idioma, tipo de sessão e outras preferências para uma experiência otimizada.',
};

export default function PreSessionPage() {
  return <PreSessionDashboard />;
}