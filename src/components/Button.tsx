import styled from '@emotion/styled';
import { ButtonHTMLAttributes } from 'react';
import { colors, radii, typography, transitions } from '../theme/tokens';
import { clsx } from 'clsx';

const Base = styled('button')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${radii.md};
  border: none;
  font-size: ${typography.body.size};
  font-weight: 600;
  padding: 12px 20px;
  cursor: pointer;
  transition: ${transitions.base};
  background: ${colors.primary};
  color: #0f172a;
  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Secondary = styled(Base)`
  background: transparent;
  color: ${colors.text};
  border: 1px solid ${colors.primary};
  &:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.18);
  }
`;

const TextButton = styled(Base)`
  background: transparent;
  color: ${colors.primary};
  padding: 8px 12px;
  border-radius: ${radii.sm};
`;

export type ButtonVariant = 'primary' | 'secondary' | 'text';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  if (variant === 'secondary') {
    return <Secondary className={className} {...rest} />;
  }
  if (variant === 'text') {
    return <TextButton className={className} {...rest} />;
  }
  return <Base className={className} {...rest} />;
}
