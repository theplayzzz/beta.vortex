'use client';

import { useParams } from 'next/navigation';
import { ProposalViewer } from '@/components/proposals/view/ProposalViewer';

export default function ProposalPage() {
  const params = useParams();
  const proposalId = params.id as string;

  return <ProposalViewer proposalId={proposalId} />;
} 