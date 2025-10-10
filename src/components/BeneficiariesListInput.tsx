import styled from '@emotion/styled';
import { useCallback } from 'react';
import { colors, radii, typography } from '../theme/tokens';
import { Button } from './Button';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Row = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto auto; /* <-- add one more column for Approve */
  gap: 8px;
`;

const Field = styled('input')`
  width: 100%;
  height: 44px;
  border-radius: ${radii.md};
  border: 1px solid rgba(203, 213, 245, 0.3);
  background: rgba(15, 23, 42, 0.6);
  color: ${colors.text};
  font-size: ${typography.body.size};
  padding: 0 16px;
  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
  }
  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const RemoveButton = styled(Button)`
  padding: 0 10px;
  min-width: 44px;
`;

const ApproveButton = styled(Button)`
  padding: 0 10px;
  white-space: nowrap;
`;

interface AddressListInputProps {
    values: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
    label?: string;
    onApprove?: (address: string, index: number) => void; // new prop for inline action
}

export function BeneficiariesListInput({ values, onChange, placeholder }: AddressListInputProps) {
    const handleChange = useCallback(
        (index: number, value: string) => {
            const next = [...values];
            next[index] = value;
            onChange(next);
        },
        [onChange, values]
    );

    const addField = useCallback(() => {
        onChange([...values, '']);
    }, [onChange, values]);

    const removeField = useCallback(
        (index: number) => {
            const next = values.filter((_, idx) => idx !== index);
            onChange(next);
        },
        [onChange, values]
    );

    return (
        <Wrapper>
            {values.map((value, idx) => (
                <Row key={idx}>
                    <Field
                        value={value}
                        onChange={(event) => handleChange(idx, event.target.value)}
                        placeholder={placeholder}
                        spellCheck={false}
                    />
                    <RemoveButton
                        type="button"
                        variant="secondary"
                        disabled={values.length <= 1}
                        onClick={() => removeField(idx)}
                    >
                        –
                    </RemoveButton>
                </Row>
            ))}
            <Button type="button" variant="secondary" onClick={addField}>
                Add address
            </Button>
        </Wrapper>
    );
}
