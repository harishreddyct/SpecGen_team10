import request from 'supertest';
import { createAppBundle } from '../src/app';

const { app } = createAppBundle({ clientOrigin: '*', publicBaseUrl: 'http://localhost:5173' });

describe('POST /api/polls', () => {
  it('creates a poll and returns 201 with a shareUrl', async () => {
    const res = await request(app).post('/api/polls').send({ title: 'Lunch?', options: ['Tacos', 'Pizza'] });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');
    expect(res.body.options).toHaveLength(2);
    expect(res.body.shareUrl).toContain(res.body.pollId);
  });

  it('returns 400 INVALID_TITLE for a blank title', async () => {
    const res = await request(app).post('/api/polls').send({ title: '', options: ['A', 'B'] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TITLE');
  });

  it('returns 400 INVALID_OPTION_COUNT for a single option', async () => {
    const res = await request(app).post('/api/polls').send({ title: 'Lunch', options: ['A'] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OPTION_COUNT');
  });

  it('returns 400 INVALID_OPTION for a blank option label', async () => {
    const res = await request(app).post('/api/polls').send({ title: 'Lunch', options: ['A', '   '] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_OPTION');
  });
});

describe('GET /api/polls/:pollId', () => {
  it('returns the poll', async () => {
    const create = await request(app).post('/api/polls').send({ title: 'Lunch?', options: ['Tacos', 'Pizza'] });
    const res = await request(app).get(`/api/polls/${create.body.pollId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Lunch?');
    expect(res.body.shareUrl).toBe(create.body.shareUrl);
  });

  it('returns 404 POLL_NOT_FOUND for an unknown poll', async () => {
    const res = await request(app).get('/api/polls/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('POLL_NOT_FOUND');
  });
});

describe('POST /api/polls/:pollId/votes', () => {
  async function createPoll() {
    const res = await request(app).post('/api/polls').send({ title: 'Lunch?', options: ['Tacos', 'Pizza'] });
    return res.body;
  }

  it('casts a vote and returns status ok with a voteId', async () => {
    const poll = await createPoll();
    const res = await request(app)
      .post(`/api/polls/${poll.pollId}/votes`)
      .send({ voterName: 'Priya', optionId: poll.options[0].optionId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', voteId: expect.any(String), errors: [] });
  });

  it('returns 400 VOTER_NAME_REQUIRED when voterName is missing', async () => {
    const poll = await createPoll();
    const res = await request(app).post(`/api/polls/${poll.pollId}/votes`).send({ optionId: poll.options[0].optionId });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VOTER_NAME_REQUIRED');
  });

  it('returns 400 OPTION_ID_REQUIRED when optionId is missing', async () => {
    const poll = await createPoll();
    const res = await request(app).post(`/api/polls/${poll.pollId}/votes`).send({ voterName: 'Priya' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('OPTION_ID_REQUIRED');
  });

  it('returns 400 VOTER_NAME_TOO_LONG for a name over 50 characters', async () => {
    const poll = await createPoll();
    const res = await request(app)
      .post(`/api/polls/${poll.pollId}/votes`)
      .send({ voterName: 'x'.repeat(51), optionId: poll.options[0].optionId });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VOTER_NAME_TOO_LONG');
  });

  it('returns a 200 business error for an unknown optionId', async () => {
    const poll = await createPoll();
    const res = await request(app).post(`/api/polls/${poll.pollId}/votes`).send({ voterName: 'Priya', optionId: 'nope' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'error', voteId: null, errors: ['Unknown option'] });
  });

  it('returns 404 POLL_NOT_FOUND for an unknown pollId', async () => {
    const res = await request(app).post('/api/polls/does-not-exist/votes').send({ voterName: 'Priya', optionId: 'opt_1' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('POLL_NOT_FOUND');
  });

  it('returns a 200 business error once the poll is closed', async () => {
    const poll = await createPoll();
    await request(app).post(`/api/polls/${poll.pollId}/close`);
    const res = await request(app)
      .post(`/api/polls/${poll.pollId}/votes`)
      .send({ voterName: 'Priya', optionId: poll.options[0].optionId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'error', voteId: null, errors: ['Poll is closed'] });
  });
});

describe('POST /api/polls/:pollId/close', () => {
  it('closes an open poll', async () => {
    const create = await request(app).post('/api/polls').send({ title: 'Lunch?', options: ['Tacos', 'Pizza'] });
    const res = await request(app).post(`/api/polls/${create.body.pollId}/close`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
    expect(res.body.title).toBe('Lunch?');
  });

  it('returns 409 POLL_ALREADY_CLOSED on a second close', async () => {
    const create = await request(app).post('/api/polls').send({ title: 'Lunch?', options: ['Tacos', 'Pizza'] });
    await request(app).post(`/api/polls/${create.body.pollId}/close`);
    const res = await request(app).post(`/api/polls/${create.body.pollId}/close`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('POLL_ALREADY_CLOSED');
  });

  it('returns 404 POLL_NOT_FOUND for an unknown poll', async () => {
    const res = await request(app).post('/api/polls/does-not-exist/close');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('POLL_NOT_FOUND');
  });
});
