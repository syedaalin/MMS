export type WhatsAppStatus = 'PENDING' | 'REGISTERED' | 'NOT_REGISTERED' | 'FAILED';

export interface WhatsAppPreferences {
  autoCheckEnabled: boolean;
  excludedCountryCodes: string[];
  verificationTrigger: 'IMMEDIATE_ON_SAVE' | 'BATCH_NIGHTLY' | 'MANUAL_ONLY';
  uiIndicatorStyle: {
    icon?: string;
    color?: string;
    label?: string;
  };
}

export interface WhatsAppVerificationResult {
  status: WhatsAppStatus;
  checkedAt: string;
  error?: string;
}

export interface WhatsAppProvider {
  verifyPhoneNumber(phoneNumber: string): Promise<WhatsAppVerificationResult>;
}

export interface ContactPhone {
  label?: string;
  number: string;
  whatsapp?: boolean;
  countryCode?: string;
}

export interface Contact {
  id: string | number;
  name: string;
  firstName: string;
  lastName?: string;
  phones?: ContactPhone[];
  whatsappStatus?: WhatsAppStatus;
  lastCheckedAt?: string;
  [key: string]: unknown;
}
