import { Server } from 'socket.io';
import { Poll } from './models';

export interface PollSocketGateway {
  broadcastVote(pollId: string, poll: Poll): void;
  broadcastClose(pollId: string, poll: Poll): void;
}

function roomName(pollId: string): string {
  return `poll:${pollId}`;
}

function publicOptions(poll: Poll) {
  return poll.options.map(({ optionId, text, voteCount }) => ({ optionId, text, voteCount }));
}

/**
 * One Socket.IO room per pollId. Wires up `poll:join` / `poll:leave` from
 * clients, and exposes broadcast methods that PollService calls after a
 * vote or close succeeds.
 */
export class SocketIoPollGateway implements PollSocketGateway {
  constructor(private io: Server) {
    this.io.on('connection', (socket) => {
      socket.on('poll:join', (payload: { pollId?: string }) => {
        if (payload && typeof payload.pollId === 'string' && payload.pollId) {
          socket.join(roomName(payload.pollId));
        }
      });

      socket.on('poll:leave', (payload: { pollId?: string }) => {
        if (payload && typeof payload.pollId === 'string' && payload.pollId) {
          socket.leave(roomName(payload.pollId));
        }
      });
    });
  }

  broadcastVote(pollId: string, poll: Poll): void {
    this.io.to(roomName(pollId)).emit('vote:recorded', {
      pollId,
      options: publicOptions(poll),
    });
  }

  broadcastClose(pollId: string, poll: Poll): void {
    this.io.to(roomName(pollId)).emit('poll:closed', {
      pollId,
      title: poll.title,
      status: 'closed',
      options: publicOptions(poll),
    });
  }
}
