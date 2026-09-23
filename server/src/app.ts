import express, { Express } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import { InMemoryPollStore } from './PollStore';
import { SocketIoPollGateway } from './PollSocketGateway';
import { PollService } from './PollService';
import { createPollController, apiErrorHandler } from './PollController';

export interface AppBundleOptions {
  clientOrigin: string;
  publicBaseUrl: string;
}

export interface AppBundle {
  app: Express;
  server: http.Server;
  io: SocketIoServer;
  service: PollService;
}

/** Wires the Presentation-facing HTTP app, the Socket.IO gateway, and the Domain/Data layers together. */
export function createAppBundle(options: AppBundleOptions): AppBundle {
  const app = express();
  app.use(cors({ origin: options.clientOrigin }));
  app.use(express.json());

  const server = http.createServer(app);
  const io = new SocketIoServer(server, {
    cors: { origin: options.clientOrigin },
  });

  const store = new InMemoryPollStore();
  const gateway = new SocketIoPollGateway(io);
  const service = new PollService(store, gateway);

  app.use('/api', createPollController(service, options.publicBaseUrl));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use(apiErrorHandler);

  return { app, server, io, service };
}

/**
 * Default export for serverless HTTP hosts (e.g. Vercel's Node.js runtime),
 * which load this module directly and invoke its default export as a plain
 * `(req, res)` request handler. An Express app instance is callable with
 * that same signature, so it can be exported as-is.
 *
 * NOTE: this only serves the HTTP API. Socket.IO requires a long-lived
 * connection that serverless functions cannot host, so real-time vote
 * broadcasts will not work through this entrypoint — voting and polling
 * results via the REST API will still function, but `PollSocketGateway`
 * pushes will have no connected clients to reach. For real-time updates in
 * production, run `server/src/index.ts` on a persistent Node host instead.
 */
const { app: defaultApp } = createAppBundle({
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5173',
});

export default defaultApp;
