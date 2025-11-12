import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';

export const configModule = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim() || '',
    join(__dirname, `env`, `.env.${nodeEnv}.local`),
    join(__dirname, `env`, `.env.${nodeEnv}`),
    join(__dirname, `env`, `.env.production`),
  ],
  isGlobal: true,
});
