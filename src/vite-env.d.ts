/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOT_DIRECT_LINE_SECRET: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
