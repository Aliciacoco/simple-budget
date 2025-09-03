
//下面的代码是为了避免 TypeScript + Vite 环境变量的类型检查问题导致的 supabaseClient.ts波浪线报错问题
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
