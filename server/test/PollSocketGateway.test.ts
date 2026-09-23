import { AddressInfo } from 'net';
import { io as ioClient, Socket } from 'socket.io-client';
import request from 'supertest';
import { createAppBundle, AppBundle } from '../src/app';

describe('Real-time broadcast over Socket.IO', () => {
  let bundle: AppBundle;
  let client: Socket;

  beforeAll((done) => {
    bundle = createAppBundle({ clientOrigin: '*', publicBaseUrl: 'http://localhost:5173' });
    bundle.server.listen(0, () => {
      const { port } = bundle.server.address() as AddressInfo;
      client = ioClient(`http://localhost:${port}`, { transports: ['websocket'] });
      client.on('connect', () => done());
    });
  });

  afterAll((done) => {
    client.close();
    bundle.server.close(() => done());
  });

  it('emits vote:recorded with updated counts to clients in the poll room', async () => {
    const create = await request(bundle.app).post('/api/polls').send({ title: 'Lunch?', options: ['Tacos', 'Pizza'] });
    const pollId = create.body.pollId;
    const optionId = create.body.options[0].optionId;

    client.emit('poll:join', { pollId });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const received = new Promise<any>((resolve) => client.once('vote:recorded', resolve));
    await request(bundle.app).post(`/api/polls/${pollId}/votes`).send({ voterName: 'Priya', optionId });

    const payload = await received;
    expect(payload.pollId).toBe(pollId);
    expect(payload.options.find((o: any) => o.optionId === optionId).voteCount).toBe(1);
  });

  it('emits poll:closed with the final snapshot to clients in the poll room', async () => {
    const create = await request(bundle.app).post('/api/polls').send({ title: 'Lunch?', options: ['Tacos', 'Pizza'] });
    const pollId = create.body.pollId;

    client.emit('poll:join', { pollId });
    await new Promise((resolve) => setTimeout(resolve, 100));

    const received = new Promise<any>((resolve) => client.once('poll:closed', resolve));
    await request(bundle.app).post(`/api/polls/${pollId}/close`);

    const payload = await received;
    expect(payload.pollId).toBe(pollId);
    expect(payload.status).toBe('closed');
  });
});
