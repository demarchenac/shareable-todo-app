// src/env.ts
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']),
    WORKOS_REDIRECT_URI: z.url(),
    WORKOS_API_KEY: z.string().min(1),
    WORKOS_CLIENT_ID: z.string().min(1),
    WORKOS_COOKIE_PASSWORD: z.string().min(32),
    CONVEX_DEPLOY_KEY: z.string().optional(),
  },

  clientPrefix: 'VITE_',
  client: {
    VITE_CONVEX_URL: z.url(),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_REDIRECT_URI: process.env.WORKOS_REDIRECT_URI,
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
    CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY,
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
  },

  emptyStringAsUndefined: true,
})
