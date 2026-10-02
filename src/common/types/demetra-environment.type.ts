import z from 'zod';
import { environmentSchema } from '../schemas/environment.schema.js';

export type DemetraEnvironment = z.infer<typeof environmentSchema>;
