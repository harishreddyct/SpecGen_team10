import express, { Express } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import { InMemoryPollStore } from './PollStore';
import { SocketIoPollGateway } from './PollSocketGateway';
import { PollService } from './PollService';
import { createPollController, apiErrorHandler } from './PollController';

export interface AppBundleOptions {
  /** One origin, or a comma-separated list (e.g. a prod domain plus Vercel preview URLs). */
  clientOrigin: string;
  publicBaseUrl: string;
}

export interface AppBundle {
  app: Express;
  server: http.Server;
  io: SocketIoServer;
  service: PollService;
}

function parseAllowedOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Wires the Presentation-facing HTTP app, the Socket.IO gateway, and the Domain/Data layers together. */
export function createAppBundle(options: AppBundleOptions): AppBundle {
  const allowedOrigins = parseAllowedOrigins(options.clientOrigin);
  // Reflects the request's origin (rather than a strict allowlist match) when
  // CLIENT_ORIGIN is blank or explicitly "*" — a misconfiguration guard /
  // explicit-wildcard case, not the normal path. The endpoints are
  // unauthenticated by design either way (see api-contracts.md), so this
  // never widens what a client can actually do.
  const corsOptions = {
    origin:
      allowedOrigins.length === 0 || allowedOrigins.includes('*')
        ? true
        : allowedOrigins.length === 1
          ? allowedOrigins[0]
          : allowedOrigins,
  };

  const app = express();
  app.use(cors(corsOptions));
  app.use(express.json());

  const server = http.createServer(app);
  const io = new SocketIoServer(server, { cors: corsOptions });

  const store = new InMemoryPollStore();
  const gateway = new SocketIoPollGateway(io);
  const service = new PollService(store, gateway);

  app.use('/api', createPollController(service, options.publicBaseUrl));
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use(apiErrorHandler);

  return { app, server, io, service };
}
