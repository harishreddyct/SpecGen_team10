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
