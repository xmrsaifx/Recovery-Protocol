import styled from '@emotion/styled';
import { Card } from '../components/Card';
import { ConnectButton } from '../components/ConnectButton';
import { colors, typography, radii, layout } from '../theme/tokens';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ShieldCheck, Users, LineChart, Cpu, ArrowRight } from 'lucide-react';

const Page = styled('section')`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;
  padding: 120px 24px 160px;
  min-height: calc(100vh - ${layout.headerHeight});
  overflow: hidden;
`;

const Glow = styled('div')`
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.6;
  pointer-events: none;
`;

const GlowPrimary = styled(Glow)`
  top: -160px;
  right: -120px;
  width: 420px;
  height: 420px;
  background: rgba(56, 189, 248, 0.28);
`;

const GlowSecondary = styled(Glow)`
  bottom: -200px;
  left: -160px;
  width: 520px;
  height: 520px;
  background: rgba(15, 118, 110, 0.24);
`;

const Hero = styled(Card)`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 20px;
  width: 100%;
  max-width: 1040px;
  padding: 48px clamp(24px, 6vw, 64px);
  background: linear-gradient(155deg, rgba(30, 64, 175, 0.32) 0%, rgba(15, 23, 42, 0.96) 60%, rgba(15, 23, 42, 0.9) 100%);
  text-align: left;
`;

const Highlight = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  width: fit-content;
  border-radius: ${radii.pill};
  background: rgba(56, 189, 248, 0.12);
  color: ${colors.primary};
  font-size: ${typography.caption.size};
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const HeroTitle = styled('h1')`
  margin: 0;
  font-size: clamp(36px, 6vw, 52px);
  line-height: 1.08;
`;

const Body = styled('p')`
  margin: 0;
  max-width: 720px;
  line-height: ${typography.body.lineHeight};
  color: ${colors.textMuted};
`;

const Actions = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-radius: ${radii.md};
  background: ${colors.primary};
  color: #0f172a;
  font-weight: 600;
  transition: all 150ms ease-out;
  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.06);
  }
`;

const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 22px;
  border-radius: ${radii.md};
  border: 1px solid rgba(148, 163, 184, 0.32);
  color: ${colors.text};
  font-weight: 600;
  transition: all 150ms ease-out;
  &:hover {
    border-color: ${colors.primary};
    color: ${colors.primary};
  }
`;

const ConnectWrapper = styled('div')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: ${radii.md};
  background: rgba(56, 189, 248, 0.12);
`;

const Section = styled('section')`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1040px;
  display: grid;
  gap: 28px;
`;

const SectionTitle = styled('h2')`
  margin: 0;
  font-size: 28px;
`;

const SectionLead = styled('p')`
  margin: 0;
  color: ${colors.textMuted};
  max-width: 720px;
`;

const FeatureGrid = styled('div')`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const FeatureCard = styled(Card)`
  gap: 16px;
  padding: 24px;
`;

const FeatureIcon = styled('div')`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${radii.md};
  background: rgba(56, 189, 248, 0.12);
  color: ${colors.primary};
`;

const StepsGrid = styled('div')`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const StepCard = styled(Card)`
  gap: 14px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

const StepNumber = styled('span')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${radii.pill};
  background: rgba(56, 189, 248, 0.16);
  color: ${colors.primary};
  font-weight: 600;
`;

const StatsGrid = styled('div')`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const StatCard = styled(Card)`
  gap: 8px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.72);
`;

const StatValue = styled('span')`
  font-size: 30px;
  font-weight: 700;
`;

const StatHint = styled('span')`
  color: ${colors.textMuted};
  font-size: ${typography.caption.size};
`;

const featureConfig = [
  {
    icon: ShieldCheck,
    title: 'Owner safeguards',
    copy: 'Define beneficiaries, guardians, and assets in a single transaction-backed workflow.'
  },
  {
    icon: Users,
    title: 'Collaborative approvals',
    copy: 'Beneficiaries receive live updates to co-sign recovery requests with built-in quorum tracking.'
  },
  {
    icon: LineChart,
    title: 'Recovery analytics',
    copy: 'Monitor time-to-claim, approval velocity, and contract status directly from the dashboard.'
  },
  {
    icon: Cpu,
    title: 'On-chain resilience',
    copy: 'Immutable Base Sepolia deployments with planned Base mainnet support at launch.'
  }
];

const stepConfig = [
  {
    title: 'Configure LifeKey',
    detail: 'Owners set beneficiaries and ERC20 coverage, then mint a LifeKey to anchor recovery.'
  },
  {
    title: 'Coordinate approvals',
    detail: 'Beneficiaries review requests, approve in-app, and watch quorum progress in real time.'
  },
  {
    title: 'Claim securely',
    detail: 'Once approvals finalize, the designated new owner claims custody with clear audit trails.'
  }
];

const statsConfig = [
  { value: '~24h', hint: 'Avg. recovery turnaround in closed beta' },
  { value: '100%', hint: 'Successful claims once quorum reached' },
  { value: 'Base', hint: 'Live on Base Sepolia • Base mainnet next' }
];

export function HomePage() {
  const { isConnected } = useAccount();

  return (
    <Page>
      <GlowPrimary />
      <GlowSecondary />

      <Hero>
        <Highlight>
          Base Sepolia Pilot
        </Highlight>
        <HeroTitle>Coordinated wallet recovery for security-minded teams</HeroTitle>
        <Body>
          LifeKey orchestrates every recovery phase—from owner configuration to beneficiary approvals and final claim—using event-driven UX that keeps each stakeholder aligned.
        </Body>
        <Actions>
          {isConnected ? (
            <>
              <PrimaryLink to="/owner">
                Launch Owner Console
                <ArrowRight size={18} />
              </PrimaryLink>
              <SecondaryLink to="/beneficiary">
                Beneficiary Desk
                <ArrowRight size={18} />
              </SecondaryLink>
              <SecondaryLink to="/claim">
                Claim Monitor
                <ArrowRight size={18} />
              </SecondaryLink>
            </>
          ) : (
            <>
              <ConnectWrapper>
                <ConnectButton />
              </ConnectWrapper>
              <SecondaryLink to="/claim">
                Track active recoveries
                <ArrowRight size={18} />
              </SecondaryLink>
            </>
          )}
        </Actions>
      </Hero>

      <Section>
        <SectionTitle>Why teams choose LifeKey</SectionTitle>
        <SectionLead>Purpose-built consoles ensure owners, beneficiaries, and claimants always know what comes next.</SectionLead>
        <FeatureGrid>
          {featureConfig.map(({ icon: Icon, title, copy }) => (
            <FeatureCard key={title}>
              <FeatureIcon>
                <Icon size={22} strokeWidth={1.8} />
              </FeatureIcon>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p style={{ margin: 0, color: colors.textMuted }}>{copy}</p>
            </FeatureCard>
          ))}
        </FeatureGrid>
      </Section>

      <Section>
        <SectionTitle>Recovery journey at a glance</SectionTitle>
        <SectionLead>Each stage maps to a dedicated interface, guarded by smart-contract events and live state sync.</SectionLead>
        <StepsGrid>
          {stepConfig.map(({ title, detail }, index) => (
            <StepCard key={title}>
              <StepNumber>{index + 1}</StepNumber>
              <h3 style={{ margin: 0 }}>{title}</h3>
              <p style={{ margin: 0, color: colors.textMuted }}>{detail}</p>
            </StepCard>
          ))}
        </StepsGrid>
      </Section>

      <Section>
        <SectionTitle>Network snapshot</SectionTitle>
        <SectionLead>Metrics from our Base Sepolia pilot program inform the upcoming mainnet release.</SectionLead>
        <StatsGrid>
          {statsConfig.map(({ value, hint }) => (
            <StatCard key={hint}>
              <StatValue>{value}</StatValue>
              <StatHint>{hint}</StatHint>
            </StatCard>
          ))}
        </StatsGrid>
      </Section>
    </Page>
  );
}
