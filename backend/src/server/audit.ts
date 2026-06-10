type AuditEvent = {
  action: 'chat.failure' | 'upload.failure';
  statusCode: number;
  userId?: string | null;
  reason: string;
  route: '/chat' | '/upload';
};

export function auditFailure(event: AuditEvent) {
  console.warn(
    JSON.stringify({
      level: 'warn',
      type: 'audit',
      timestamp: new Date().toISOString(),
      ...event,
    }),
  );
}
