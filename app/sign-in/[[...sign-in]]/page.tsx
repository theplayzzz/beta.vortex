import { SignIn } from '@clerk/nextjs';
import AuthTabs from '@/components/auth/auth-tabs';
import PromoSection from '@/components/auth/promo-section';

export default function SignInPage() {
  const clerkCustomTheme = {
    variables: {
      colorPrimary: '#6be94c',        // sgbus-green
      colorBackground: '#171818',     // eerie-black
      colorInputBackground: '#0e0f0f', // night
      colorText: '#f9fbfc',           // seasalt
      colorTextSecondary: '#cfc6fe',  // periwinkle
      colorNeutral: '#171818',        // eerie-black
      colorDanger: '#ef4444',         // red-500
      colorSuccess: '#6be94c',        // sgbus-green
      colorWarning: '#f59e0b',        // amber-500
      borderRadius: '0.75rem',
      fontFamily: 'inherit',
    },
    elements: {
      rootBox: 'mx-auto',
      card: 'bg-eerie-black border border-seasalt/10 shadow-xl rounded-3xl',
      headerTitle: 'text-seasalt',
      headerSubtitle: 'text-periwinkle',
      socialButtonsBlockButton: 'bg-night border-seasalt/20 text-seasalt hover:bg-seasalt/10',
      socialButtonsBlockButtonText: 'text-seasalt',
      dividerLine: 'bg-seasalt/20',
      dividerText: 'text-periwinkle',
      formFieldLabel: 'text-seasalt',
      formFieldInput: 'bg-night border-seasalt/20 text-seasalt focus:border-sgbus-green',
      formButtonPrimary: 'bg-sgbus-green hover:bg-sgbus-green/90 text-night font-semibold rounded-xl',
      footerActionLink: 'text-periwinkle hover:text-periwinkle/80',
      identityPreviewText: 'text-seasalt',
      identityPreviewEditButton: 'text-periwinkle hover:text-periwinkle/80',
    },
  };

  return (
    <div className="min-h-screen bg-night">
      <div className="container mx-auto lg:flex lg:min-h-screen">
        {/* Lado Esquerdo - Formulário */}
        <div className="lg:w-2/5 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Header com logo */}
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-sgbus-green rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-night">V</span>
              </div>
              <h1 className="text-2xl font-semibold text-seasalt mb-2">
                Bem-vindo ao Vortex Vault
              </h1>
              <p className="text-periwinkle">
                Sistema de Planejamento e Gestão com IA
              </p>
            </div>

            {/* Tabs de navegação */}
            <AuthTabs />
            
            {/* Container do formulário */}
            <div className="bg-eerie-black rounded-3xl border border-seasalt/10 p-8">
              <SignIn 
                appearance={clerkCustomTheme}
                redirectUrl="/"
              />
            </div>
          </div>
        </div>
        
        {/* Lado Direito - Seção Promocional */}
        <div className="lg:w-3/5 flex items-center justify-center p-8 lg:block hidden">
          <PromoSection />
        </div>
      </div>
    </div>
  );
} 