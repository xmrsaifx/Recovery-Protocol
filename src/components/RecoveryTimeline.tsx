import styled from '@emotion/styled';
import { colors, radii, typography } from '../theme/tokens';
import { LucideIcon, ShieldCheck, UsersRound, Crown } from 'lucide-react';

const Wrapper = styled('div')`
  display: grid;
  gap: 16px;
`;

const StepRow = styled('div')<{ active: boolean; completed: boolean }>`
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 16px;
  opacity: ${({ completed }) => (completed ? 0.7 : 1)};
`;

const IconWrap = styled('div')<{ status: 'pending' | 'active' | 'completed' }>`
  width: 32px;
  height: 32px;
  border-radius: ${radii.pill};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ status }) =>
    status === 'active'
      ? colors.primary
      : status === 'completed'
      ? 'rgba(16, 185, 129, 0.15)'
      : 'rgba(56, 189, 248, 0.12)'};
  color: ${({ status }) =>
    status === 'active' ? '#0F172A' : status === 'completed' ? colors.success : colors.primary};
`;

const Title = styled('div')`
  font-size: ${typography.body.size};
  font-weight: 600;
`;

const Subtitle = styled('div')`
  font-size: ${typography.caption.size};
  color: ${colors.textMuted};
`;

export interface RecoveryTimelineProps {
  approvals: number;
  totalBeneficiaries: number;
  proposalActive: boolean;
  newOwnerReady: boolean;
}

export function RecoveryTimeline({ approvals, totalBeneficiaries, proposalActive, newOwnerReady }: RecoveryTimelineProps) {
  const steps: Array<{ title: string; subtitle: string; icon: LucideIcon; status: 'pending' | 'active' | 'completed' }> = [
    {
      title: 'Initiate recovery',
      subtitle: proposalActive ? 'Request is live' : 'Waiting for beneficiary request',
      icon: ShieldCheck,
      status: proposalActive || approvals > 0 ? (approvals > 0 ? 'completed' : 'active') : 'pending'
    },
    {
      title: 'Collect approvals',
      subtitle: `${approvals} of ${totalBeneficiaries} approvals`,
      icon: UsersRound,
      status:
        approvals >= totalBeneficiaries && totalBeneficiaries > 0
          ? 'completed'
          : proposalActive
          ? 'active'
          : approvals > 0
          ? 'completed'
          : 'pending'
    },
    {
      title: 'Claim LifeKey',
      subtitle: newOwnerReady ? 'Ready for claim' : 'Waiting for completion',
      icon: Crown,
      status: newOwnerReady ? 'active' : approvals >= totalBeneficiaries && totalBeneficiaries > 0 ? 'active' : 'pending'
    }
  ];

  return (
    <Wrapper>
      {steps.map(({ icon: Icon, title, subtitle, status }, index) => (
        <StepRow key={index} active={status === 'active'} completed={status === 'completed'}>
          <IconWrap status={status}>
            <Icon size={18} />
          </IconWrap>
          <div>
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </div>
        </StepRow>
      ))}
    </Wrapper>
  );
}
