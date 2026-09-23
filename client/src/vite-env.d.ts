/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full origin of the deployed backend, e.g. https://teamlunch-poll-api.onrender.com. See src/config.ts. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
