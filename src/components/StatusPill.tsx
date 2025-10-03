import styled from '@emotion/styled';
import { colors, radii, typography } from '../theme/tokens';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const backgroundByTone: Record<Tone, string> = {
  info: 'rgba(56, 189, 248, 0.18)',
  success: 'rgba(16, 185, 129, 0.18)',
  warning: 'rgba(249, 115, 22, 0.18)',
  danger: 'rgba(239, 68, 68, 0.18)'
};

const colorByTone: Record<Tone, string> = {
  info: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger
};

const Pill = styled('span')<{ tone: Tone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: ${radii.pill};
  font-size: ${typography.caption.size};
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: ${({ tone }) => backgroundByTone[tone]};
  color: ${({ tone }) => colorByTone[tone]};
`;

interface StatusPillProps {
  tone?: Tone;
  children: string;
}

export function StatusPill({ tone = 'info', children }: StatusPillProps) {
  return <Pill tone={tone}>{children}</Pill>;
}
