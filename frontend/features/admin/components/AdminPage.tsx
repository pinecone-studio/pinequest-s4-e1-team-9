'use client';

import AuthGate from '@/features/auth/AuthGate';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  return (
    <AuthGate>
      <AdminDashboard />
    </AuthGate>
  );
}
