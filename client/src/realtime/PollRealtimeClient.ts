import { io, Socket } from 'socket.io-client';
import { PollOption } from '../types';
import { API_BASE_URL } from '../config';

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
    // Falls back to the page's own origin (proxied to the backend in dev,
    // see vite.config.ts) unless VITE_API_BASE_URL points it elsewhere.
    socket = API_BASE_URL ? io(API_BASE_URL) : io();
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
