import styled from '@emotion/styled';
import { InputHTMLAttributes } from 'react';
import { colors, radii, typography, transitions } from '../theme/tokens';

const Field = styled('input')`
  width: 100%;
  height: 44px;
  border-radius: ${radii.md};
  border: 1px solid rgba(203, 213, 245, 0.3);
  background: rgba(15, 23, 42, 0.6);
  color: ${colors.text};
  font-size: ${typography.body.size};
  padding: 0 16px;
  transition: ${transitions.base};
  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
  }
  &::placeholder {
    color: ${colors.textMuted};
  }
`;

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Field {...props} />;
}
