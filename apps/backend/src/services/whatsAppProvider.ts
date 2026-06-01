import { WhatsAppProvider, WhatsAppVerificationResult } from './whatsAppTypes.js';
// @ts-ignore
import pkg from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';

const { Client, LocalAuth } = pkg;

/**
 * Mock provider for local development, testing, and simulation.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  async verifyPhoneNumber(phoneNumber: string): Promise<WhatsAppVerificationResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 8) {
      return {
        status: 'FAILED',
        checkedAt: new Date().toISOString(),
        error: 'Invalid phone number format or length'
      };
    }

    const isRegistered = digits.endsWith('99') || digits.endsWith('88') || digits.endsWith('77') || digits.endsWith('00');

    return {
      status: isRegistered ? 'REGISTERED' : 'NOT_REGISTERED',
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Production WhatsApp verification engine wrapping whatsapp-web.js and Puppeteer.
 * Launches a headless browser, prints session QR codes to the terminal, and queries real servers.
 */
export class PuppeteerWhatsAppProvider implements WhatsAppProvider {
  private client: any = null;
  private isInitialized = false;

  constructor() {
    this.initializeClient().catch((err) => {
      console.warn('PuppeteerWhatsAppProvider failed to initialize client session:', err.message);
    });
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'mms-whatsapp-session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      // Output QR code inside terminal logs for user authentication scanning
      this.client.on('qr', (qr: string) => {
        console.log('\n--- SCAN THIS QR CODE WITH WHATSAPP TO CONNECT ---');
        qrcode.generate(qr, { small: true });
        console.log('--------------------------------------------------\n');
      });

      this.client.on('ready', () => {
        console.log('WhatsApp Web Client Session is successfully ready and authenticated!');
        this.isInitialized = true;
      });

      this.client.on('auth_failure', (msg: string) => {
        console.error('WhatsApp authentication failed:', msg);
        this.isInitialized = false;
      });

      this.client.on('disconnected', (reason: string) => {
        console.warn('WhatsApp client was disconnected:', reason);
        this.isInitialized = false;
      });

      await this.client.initialize();
    } catch (error: any) {
      this.isInitialized = false;
      throw new Error(`Failed to instantiate WhatsApp web engine: ${error.message}`);
    }
  }

  async verifyPhoneNumber(phoneNumber: string): Promise<WhatsAppVerificationResult> {
    try {
      if (!this.isInitialized || !this.client) {
        return {
          status: 'FAILED',
          checkedAt: new Date().toISOString(),
          error: 'WhatsApp client is not ready or authenticated. Please scan the QR code in the terminal logs.'
        };
      }

      // Format clean number digits
      const cleanNumber = phoneNumber.replace(/\D/g, '');

      // Check number registration using whatsapp-web.js API (getNumberId)
      // returns { id: { user: string, _serialized: string } } if registered, otherwise null
      const numberId = await this.client.getNumberId(cleanNumber);
      const isRegistered = !!numberId;

      return {
        status: isRegistered ? 'REGISTERED' : 'NOT_REGISTERED',
        checkedAt: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        status: 'FAILED',
        checkedAt: new Date().toISOString(),
        error: error.message || 'WhatsApp web check failed'
      };
    }
  }
}
