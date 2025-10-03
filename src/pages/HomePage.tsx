import styled from '@emotion/styled';
import { Card } from '../components/Card';
import { ConnectButton } from '../components/ConnectButton';
import { colors, typography, radii } from '../theme/tokens';
import { Link } from 'react-router-dom';

const Hero = styled(Card)`
  align-items: flex-start;
  gap: 20px;
  background: linear-gradient(160deg, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%);
`;

const Title = styled('h1')`
  margin: 0;
  font-size: ${typography.title.size};
  line-height: ${typography.title.lineHeight};
`;

const Body = styled('p')`
  margin: 0;
  line-height: ${typography.body.lineHeight};
  color: ${colors.textMuted};
  max-width: 620px;
`;

const Actions = styled('div')`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: ${radii.md};
  background: ${colors.primary};
  color: #0f172a;
  font-weight: 600;
  transition: all 150ms ease-out;
  &:hover {
    filter: brightness(1.05);
  }
`;

const SecondaryLink = styled(PrimaryLink)`
  background: transparent;
  color: ${colors.text};
  border: 1px solid ${colors.primary};
  &:hover {
    background: rgba(56, 189, 248, 0.18);
  }
`;

export function HomePage() {
  return (
    <Hero>
      <Title>Self-Custody Recovery Coordination</Title>
      <Body>
        LifeKey Protocol lets owners predefine beneficiaries who can collaboratively recover a wallet and transfer configured ERC20 balances when needed. Track each phase from initiation through claim with real-time contract events.
      </Body>
      <Actions>
        <PrimaryLink to="/owner">Owner Console</PrimaryLink>
        <SecondaryLink to="/beneficiary">Beneficiary Desk</SecondaryLink>
        <ConnectButton />
      </Actions>
    </Hero>
  );
}
