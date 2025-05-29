import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-night">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-sgbus-green mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-seasalt mb-4">Página não encontrada</h2>
        <p className="text-periwinkle mb-6 max-w-md">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center px-6 py-3 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors"
        >
          ← Voltar ao início
        </Link>
      </div>
    </div>
  );
} 