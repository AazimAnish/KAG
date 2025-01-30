declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    }
  }
}

export {} 