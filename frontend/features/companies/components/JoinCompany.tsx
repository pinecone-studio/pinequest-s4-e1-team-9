'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { joinCompanyByCode } from '@/features/companies/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Surface } from '@/shared/ui/product';

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
    <Surface className="p-6">
      <h2 className="mb-2 text-xl font-semibold">Join an AI</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Enter the invitation code shared by an Owner.
      </p>
      <form onSubmit={handleJoin} className="space-y-4">
        <label htmlFor="invitationCode" className="text-sm font-medium">
          Invitation code
        </label>
        <Input
          id="invitationCode"
          value={invitationCode}
          onChange={(e) => setInvitationCode(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Joining...' : 'Join Company'}
        </Button>
      </form>
      {error && (
        <div className="mt-4 flex items-center text-sm text-destructive">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}
    </Surface>
  );
}
