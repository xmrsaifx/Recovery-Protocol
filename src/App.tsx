import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { HomePage } from './pages/HomePage';
import { OwnerPage } from './pages/OwnerPage';
import { BeneficiaryPage } from './pages/BeneficiaryPage';
import { ClaimPage } from './pages/ClaimPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/owner" element={<OwnerPage />} />
        <Route path="/beneficiary" element={<BeneficiaryPage />} />
        <Route path="/claim" element={<ClaimPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
