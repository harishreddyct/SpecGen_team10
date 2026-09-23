// When the client and server are deployed to different origins — e.g. the
// client on Vercel and the server on Render/Railway/Fly.io, since Vercel's
// Serverless Functions can't host a persistent Socket.IO connection or the
// in-memory poll store this app relies on — set VITE_API_BASE_URL at build
// time to the server's full origin (e.g. https://teamlunch-poll-api.onrender.com).
//
// Leave it unset for local development: requests stay relative, and Vite's
// dev server proxies them to the backend (see vite.config.ts).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
