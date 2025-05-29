import { RichnessScoreBadge } from './RichnessScoreBadge';

interface ClientHeaderProps {
  client: {
    id: string;
    name: string;
    industry: string | null;
    richnessScore: number;
    businessDetails?: string | null;
  };
}

export function ClientHeader({ client }: ClientHeaderProps) {
  return (
    <div className="bg-night border border-seasalt/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-seasalt mb-1">{client.name}</h2>
          <div className="flex items-center gap-2">
            <p className="text-periwinkle">
              {client.industry || 'Setor não definido'}
            </p>
            {client.industry === 'Outro' && client.businessDetails && (
              <span className="text-xs text-seasalt/70 bg-eerie-black px-2 py-1 rounded">
                {client.businessDetails}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <RichnessScoreBadge score={client.richnessScore} />
        </div>
      </div>
    </div>
  );
} 