import { DataSource } from 'typeorm';
import path from 'node:path';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

dotenvExpand.expand(dotenv.config({ quiet: true }));

/** DataSource for migrations */
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(import.meta.dirname, 'src/**/*.entity.ts')],
  migrations: [path.join(import.meta.dirname, 'database/migrations/**/*.ts')],
  migrationsRun: false,
  migrationsTableName: 'migrations',
  migrationsTransactionMode: 'all',
});

export default dataSource;
