import z from 'zod';

export const environmentSchema = z.object({
  PORT: z.coerce.number(),
  JWT_SECRET: z.string(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_DB_TEST: z.string(),
  DATABASE_URL: z.string(),
  DATABASE_TEST_URL: z.string(),
  NODE_ENV: z.string(),
});
