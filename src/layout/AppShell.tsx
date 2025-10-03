import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { layout, colors, shadows, radii, typography } from '../theme/tokens';
import { Link, NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

const Shell = styled('div')`
  min-height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled('header')`
  height: ${layout.headerHeight};
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid ${colors.border};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderInner = styled('div')`
  width: 100%;
  max-width: ${layout.maxWidth};
  padding: 0 ${layout.gutter};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  font-size: ${typography.section.size};
  font-weight: ${typography.section.weight};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Nav = styled('nav')`
  display: flex;
  gap: 16px;
`;

const NavButton = styled(NavLink)`
  padding: 10px 16px;
  border-radius: ${radii.pill};
  border: 1px solid transparent;
  transition: all 150ms ease-out;
  &.active {
    background: ${colors.primary};
    color: #0f172a;
  }
  &:not(.active):hover {
    border-color: ${colors.primary};
  }
`;

const Main = styled('main')`
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  padding: 32px 16px 64px;
`;

const Content = styled('div')`
  width: 100%;
  max-width: ${layout.maxWidth};
  display: grid;
  gap: 24px;
`;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Shell>
      <Header>
        <HeaderInner>
          <Brand to="/">LifeKey</Brand>
          <Nav>
            <NavButton to="/owner" className={({ isActive }) => clsx({ active: isActive })}>
              Owner
            </NavButton>
            <NavButton to="/beneficiary" className={({ isActive }) => clsx({ active: isActive })}>
              Beneficiary
            </NavButton>
            <NavButton to="/claim" className={({ isActive }) => clsx({ active: isActive })}>
              Claim
            </NavButton>
          </Nav>
        </HeaderInner>
      </Header>
      <Main>
        <Content>{children}</Content>
      </Main>
    </Shell>
  );
}
