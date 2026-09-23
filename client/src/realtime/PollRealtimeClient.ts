import { io, Socket } from 'socket.io-client';
import { PollOption } from '../types';

export interface VoteRecordedPayload {
  pollId: string;
  options: PollOption[];
}

export interface PollClosedPayload {
  pollId: string;
  title: string;
  status: 'closed';
  options: PollOption[];
}

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    // No URL: connects to the page's own origin, which the Vite dev
    // server proxies to the backend (see vite.config.ts).
    socket = io();
  }
  return socket;
}

/** Thin wrapper around the poll-scoped Socket.IO channel described in technical-architecture.md. */
export const PollRealtimeClient = {
  join(pollId: string): void {
    getSocket().emit('poll:join', { pollId });
  },

  leave(pollId: string): void {
    getSocket().emit('poll:leave', { pollId });
  },

  onVoteRecorded(handler: (payload: VoteRecordedPayload) => void): () => void {
    getSocket().on('vote:recorded', handler);
    return () => getSocket().off('vote:recorded', handler);
  },

  onPollClosed(handler: (payload: PollClosedPayload) => void): () => void {
    getSocket().on('poll:closed', handler);
    return () => getSocket().off('poll:closed', handler);
  },

  // On reconnect, the caller should re-fetch poll state in case any events
  // were missed while disconnected (see error-handling.md).
  onReconnect(handler: () => void): () => void {
    getSocket().io.on('reconnect', handler);
    return () => getSocket().io.off('reconnect', handler);
  },
};
