import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { colors, radii, shadows } from '../theme/tokens';

const Wrapper = styled('div')`
  background: ${colors.card};
  border-radius: ${radii.lg};
  padding: 24px;
  box-shadow: ${shadows.card};
  border: 1px solid rgba(203, 213, 245, 0.12);
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export function Card({ children }: { children: ReactNode }) {
  return <Wrapper>{children}</Wrapper>;
}
