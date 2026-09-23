import { Router, Request, Response, NextFunction } from 'express';
import { PollService } from './PollService';
import { Poll } from './models';
import { ApiError } from './errors';

function serializePoll(poll: Poll, shareUrl: string) {
  return {
    pollId: poll.pollId,
    shareUrl,
    title: poll.title,
    status: poll.status,
    options: poll.options,
  };
}

/** HTTP routes per api-contracts.md / technical-architecture.md's PollController table. */
export function createPollController(service: PollService, publicBaseUrl: string): Router {
  const router = Router();

  function shareUrlFor(pollId: string): string {
    return `${publicBaseUrl.replace(/\/$/, '')}/polls/${pollId}`;
  }

  router.post('/polls', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, options } = req.body ?? {};
      const poll = service.createPoll(title, options);
      res.status(201).json(serializePoll(poll, shareUrlFor(poll.pollId)));
    } catch (err) {
      next(err);
    }
  });

  router.get('/polls/:pollId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const poll = service.getPoll(req.params.pollId);
      res.status(200).json(serializePoll(poll, shareUrlFor(poll.pollId)));
    } catch (err) {
      next(err);
    }
  });

  router.post('/polls/:pollId/votes', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { voterName, optionId } = req.body ?? {};
      const result = service.castVote(req.params.pollId, voterName, optionId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/polls/:pollId/close', (req: Request, res: Response, next: NextFunction) => {
    try {
      const poll = service.closePoll(req.params.pollId);
      res.status(200).json({
        pollId: poll.pollId,
        title: poll.title,
        status: poll.status,
        options: poll.options,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function apiErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ code: err.code, message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ code: 'SERVER_ERROR', message: 'Something went wrong.' });
}
