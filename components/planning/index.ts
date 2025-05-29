// ===================================================================
// COMPONENTS INDEX - Sistema de Planejamento Estratégico
// ===================================================================

// Core components - Formulário multi-etapas (PLAN-006)
export { PlanningForm } from './PlanningForm';
export { PlanningFormWithClient } from './PlanningFormWithClient';

// Client context and utilities
export { ClientFormContext, useClientFormContext } from './ClientFormContext';
export { ClientHeader } from './ClientHeader';
export { FormProgress } from './FormProgress';

// Planning management components
export { PlanningList } from './PlanningList';
export { PlanningCard } from './PlanningCard';
export { PlanningCardSkeleton } from './PlanningCardSkeleton';
export { PlanningFilters } from './PlanningFilters';

// 🆕 PLAN-008: Visualização e edição
export { PlanningDetails } from './PlanningDetails';
export { FormDataDisplay } from './FormDataDisplay';

// UI components
export { RichnessScoreBadge } from './RichnessScoreBadge';
export { QuestionField } from './QuestionField';

// Tab Components
export { BasicInfoTab } from './tabs/BasicInfoTab';
export { SectorDetailsTab } from './tabs/SectorDetailsTab';
export { MarketingTab } from './tabs/MarketingTab';
export { CommercialTab } from './tabs/CommercialTab';

// Demo components (para desenvolvimento)
export { ComponentsDemo } from './ComponentsDemo';
export { SectorQuestionsDemo } from './SectorQuestionsDemo';
export { MarketingCommercialDemo } from './MarketingCommercialDemo'; 