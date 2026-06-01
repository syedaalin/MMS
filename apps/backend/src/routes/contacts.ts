import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { fetchCollection, persistCollection } from '../services/dbSyncService.js';
import { handleContactSaveOrUpdate, getWhatsAppPreferences } from '../services/whatsAppService.js';
import { Contact } from '../services/whatsAppTypes.js';

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
  fastify.post<{ Body: Contact }>('/', async (request, reply) => {
    try {
      const contact = request.body;
      if (!contact || !contact.firstName) {
        return reply.status(400).send({
          type: 'validation_error',
          message: 'Contact record must contain at least a firstName property'
        });
      }

      const id = contact.id || `temp-${Date.now()}`;
      const contactWithId = { ...contact, id };

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
    } catch (error: any) {
      return reply.status(500).send({
        type: 'database_error',
        message: error.message || 'Failed to save contact record'
      });
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

      return reply.send({
        whatsappStatus: contact.whatsappStatus || 'PENDING',
        lastCheckedAt: contact.lastCheckedAt || null,
        uiIndicatorStyle: prefs.uiIndicatorStyle
      });
    } catch (error: any) {
      return reply.status(500).send({
        type: 'server_error',
        message: error.message || 'Failed to retrieve WhatsApp status'
      });
    }
  });
}
