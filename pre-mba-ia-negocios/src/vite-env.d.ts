/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_PATH?: string;
  readonly VITE_ACCESS_PROVIDER?: string;
  readonly VITE_ACCESS_API_BASE_URL?: string;
  readonly VITE_D2L_ORIGIN?: string;
  readonly VITE_ALLOW_DATE_OVERRIDE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
