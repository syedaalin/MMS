import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { fetchCollection, persistCollection } from '../services/dbSyncService.js';
import { handleContactSaveOrUpdate, getWhatsAppPreferences } from '../services/whatsAppService.js';
import { applyTitleCaseToContact, normalizeToE164, parsePhoneNumber } from '@mms/shared';
import type { Contact, WhatsAppStatus } from '@mms/shared';

const contactBodySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['firstName'],
    additionalProperties: true,
    properties: {
      id: { type: ['string', 'number'] },
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string' },
      name: { type: 'string' },
      gender: { type: 'string' },
      dob: { type: 'string' },
      isSyed: { type: 'boolean' },
      avatar: { type: ['string', 'null'] },
      lifecycleStage: { type: 'string' },
      rating: { type: 'number' },
      phones: {
        type: 'array',
        items: {
          type: 'object',
          required: ['number'],
          properties: {
            label: { type: 'string' },
            number: { type: 'string' },
            countryCode: { type: 'string' }
          }
        }
      },
      emails: {
        type: 'array',
        items: {
          type: 'object',
          required: ['address'],
          properties: {
            label: { type: 'string' },
            address: { type: 'string' }
          }
        }
      },
      addresses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            line1: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            label: { type: 'string' }
          }
        }
      },
      socials: {
        type: 'array',
        items: {
          type: 'object',
          required: ['platform', 'url'],
          properties: {
            platform: { type: 'string' },
            url: { type: 'string' }
          }
        }
      },
      emergencyContacts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            relationship: { type: 'string' },
            phone: { type: 'string' },
            contactId: { type: ['string', 'number'] }
          }
        }
      },
      relationships: {
        type: 'array',
        items: {
          type: 'object',
          required: ['contactId', 'type'],
          properties: {
            contactId: { type: ['string', 'number'] },
            type: { type: 'string' }
          }
        }
      }
    }
  }
};

const contactParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 }
    }
  }
};

export default async function contactRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Securing endpoints with JWT authentication hook
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      return reply.status(401).send({
        type: 'auth_required',
        message: 'Authentication is required to perform contact actions'
      });
    }
  });

  // POST /api/contacts - Saves or updates a contact record and hooks into check pipeline
  fastify.post<{ Body: Contact }>('/', { schema: contactBodySchema }, async (request, reply) => {
    try {
      const contact = request.body;

      if (contact.phones && Array.isArray(contact.phones)) {
        const defaultCode = '+92';
        contact.phones = contact.phones.map((p) => {
          const e164 = normalizeToE164(p.countryCode || defaultCode, p.number);
          const parsed = parsePhoneNumber(e164, p.countryCode || defaultCode);
          return {
            ...p,
            countryCode: parsed.countryCode,
            number: parsed.number
          };
        });
      }

      const id = contact.id || `temp-${Date.now()}`;
      const contactWithId = applyTitleCaseToContact({ ...contact, id }) as Contact;

      const contactsData = await fetchCollection('contacts');
      const contacts = (contactsData as Contact[]) || [];

      const index = contacts.findIndex((c) => String(c.id) === String(id));
      if (index > -1) {
        contacts[index] = contactWithId;
      } else {
        contacts.push(contactWithId);
      }

      await persistCollection('contacts', contacts);

      // Async verification hook triggers background validation task without blocking HTTP thread
      await handleContactSaveOrUpdate(contactWithId);

      return reply.send({ success: true, contact: contactWithId });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save contact record';
      return reply.status(500).send({ type: 'database_error', message: msg });
    }
  });

  // GET /api/contacts/:id/whatsapp-status - Returns live status, styling metadata, and check timestamp
  fastify.get<{ Params: { id: string } }>('/:id/whatsapp-status', { schema: contactParamsSchema }, async (request, reply) => {
    try {
      const { id } = request.params;
      const contactsData = await fetchCollection('contacts');
      if (!contactsData) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact list is empty' });
      }

      const contacts = contactsData as Contact[];
      const contact = contacts.find((c) => String(c.id) === String(id));
      if (!contact) {
        return reply.status(404).send({ type: 'not_found', message: `Contact with ID "${id}" not found` });
      }

      const prefs = await getWhatsAppPreferences();

      const defaultStatus: WhatsAppStatus = 'PENDING';
      return reply.send({
        whatsappStatus: (contact.whatsappStatus as WhatsAppStatus) || defaultStatus,
        lastCheckedAt: contact.lastCheckedAt || null,
        uiIndicatorStyle: prefs.uiIndicatorStyle
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to retrieve WhatsApp status';
      return reply.status(500).send({ type: 'server_error', message: msg });
    }
  });
}
