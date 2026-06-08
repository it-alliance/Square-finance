import 'dotenv/config';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL as string,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_for_development_only',
  PORT: process.env.PORT || 4000,
};
