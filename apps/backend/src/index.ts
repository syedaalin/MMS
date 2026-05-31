import { buildApp } from './app.js';

/**
 * Boots the Fastify server by building the app and listening on the configured port.
 *
 * @returns {Promise<void>}
 */
async function startServer(): Promise<void> {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`Backend server successfully listening on http://${host}:${port}`);
  } catch (error) {
    console.error('Error starting backend server:', error);
    process.exit(1);
  }
}

// Start execution
void startServer();
