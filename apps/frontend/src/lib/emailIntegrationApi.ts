import type { EmailIntegrationConfig } from '@mms/shared';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('mms_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchEmailIntegration(): Promise<EmailIntegrationConfig | null> {
  try {
    const res = await fetch('/api/email/integration', { headers: authHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as EmailIntegrationConfig;
  } catch {
    return null;
  }
}

export type SaveEmailIntegrationInput = EmailIntegrationConfig & {
  smtpPassword?: string;
};

export async function saveEmailIntegration(
  payload: SaveEmailIntegrationInput,
): Promise<EmailIntegrationConfig> {
  const res = await fetch('/api/email/integration', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? 'Failed to save email integration');
  }
  return (await res.json()) as EmailIntegrationConfig;
}

export async function testEmailIntegration(): Promise<EmailIntegrationConfig> {
  const res = await fetch('/api/email/integration/test', {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? 'Email test failed');
  }
  const data = (await res.json()) as { config: EmailIntegrationConfig };
  return data.config;
}

export async function sendVerificationCodeEmail(code: string): Promise<boolean> {
  try {
    const res = await fetch('/api/email/verification-code', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { delivered?: boolean };
    return data.delivered === true;
  } catch {
    return false;
  }
}
