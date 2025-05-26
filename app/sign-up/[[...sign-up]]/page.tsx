import { SignUp } from '@clerk/nextjs';
import AuthTabs from '@/components/auth/auth-tabs';
import PromoSection from '@/components/auth/promo-section';

export default function SignUpPage() {
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
      rootBox: 'mx-auto flex flex-col items-center justify-center w-full',
      card: 'w-full mx-auto',
      main: 'w-full flex flex-col items-center',
      headerTitle: 'text-seasalt text-center',
      headerSubtitle: 'text-periwinkle text-center',
      socialButtonsBlockButton: 'bg-night border-seasalt/20 text-seasalt hover:bg-seasalt/10 flex-1 justify-center',
      socialButtonsBlockButtonText: 'text-seasalt',
      socialButtons: 'w-full flex flex-row gap-3',
      dividerLine: 'bg-seasalt/20',
      dividerText: 'text-periwinkle',
      formFieldLabel: 'text-seasalt',
      formFieldInput: 'bg-night border-seasalt/20 text-seasalt focus:border-sgbus-green w-full',
      formButtonPrimary: 'bg-sgbus-green hover:bg-sgbus-green/90 text-night font-semibold rounded-xl w-full',
      footerActionLink: 'text-periwinkle hover:text-periwinkle/80',
      identityPreviewText: 'text-seasalt',
      identityPreviewEditButton: 'text-periwinkle hover:text-periwinkle/80',
      form: 'w-full',
      formField: 'w-full',
    },
  };

  return (
    <div className="min-h-screen bg-night">
      <div className="container mx-auto lg:flex lg:min-h-screen">
        {/* Lado Esquerdo - Formulário */}
        <div className="lg:w-2/5 flex flex-col justify-center p-8">
          <div className="w-full max-w-md mx-auto">
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
              <SignUp 
                appearance={clerkCustomTheme}
                redirectUrl="/"
              />
            </div>
          </div>
        </div>
        
        {/* Lado Direito - Seção Promocional (Desktop) */}
        <div className="hidden lg:flex lg:w-3/5 p-8">
          <div className="w-full max-w-4xl mx-auto">
            {/* Espaçamento invisível para alinhar com o header do formulário */}
            <div className="mb-8 text-center opacity-0 pointer-events-none">
              <div className="w-16 h-16 mx-auto mb-4"></div>
              <h1 className="text-2xl mb-2">Placeholder</h1>
              <p>Placeholder</p>
            </div>
            
            {/* Espaçamento invisível para alinhar exatamente com os tabs */}
            <div className="flex space-x-1 bg-eerie-black/50 p-1 rounded-2xl mb-8 opacity-0 pointer-events-none">
              <div className="flex-1 py-3 px-6"></div>
              <div className="flex-1 py-3 px-6"></div>
            </div>
            
            {/* Conteúdo promocional alinhado com os tabs */}
            <PromoSection />
          </div>
        </div>
      </div>
      
      {/* Seção Promocional Mobile - Visível apenas em telas pequenas */}
      <div className="lg:hidden p-8 border-t border-seasalt/10">
        <PromoSection />
      </div>
    </div>
  );
} 