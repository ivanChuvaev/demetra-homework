import z from 'zod';

export const createRoleSchema = z.object({
  name: z.string().nonempty().max(100),
  description: z.string().max(250),
});

export const updateRoleSchema = createRoleSchema;
export const updateRolePartialSchema = createRoleSchema.partial();
