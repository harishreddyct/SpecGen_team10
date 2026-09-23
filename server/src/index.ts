import { createAppBundle } from './app';

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

const { server } = createAppBundle({ clientOrigin: CLIENT_ORIGIN, publicBaseUrl: PUBLIC_BASE_URL });

server.listen(PORT, () => {
  console.log(`TeamLunch Poll server listening on http://localhost:${PORT}`);
});
