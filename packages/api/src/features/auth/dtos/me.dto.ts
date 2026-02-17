import { z } from "zod";

export const MeOutputDto = z
  .object({
    publicKey: z.string(),
    name: z.string().nullable(),
    organization: z.any().nullable(),
    role: z.number().nullable(),
  })
  .nullable();

export type MeOutput = z.infer<typeof MeOutputDto>;
