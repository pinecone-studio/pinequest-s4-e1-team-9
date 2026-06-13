'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { joinCompanyByCode } from '@/features/companies/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export default function JoinCompany() {
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await joinCompanyByCode(invitationCode);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-bold">Join a Company</h2>
      <form onSubmit={handleJoin} className="space-y-4">
        <Input
          placeholder="Enter invitation code"
          value={invitationCode}
          onChange={(e) => setInvitationCode(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Joining...' : 'Join Company'}
        </Button>
      </form>
      {error && (
        <div className="mt-4 flex items-center text-sm text-red-600">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
