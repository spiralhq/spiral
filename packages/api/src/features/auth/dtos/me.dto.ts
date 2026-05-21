import { z } from "zod";

export const OrganizationDto = z.object({
  id: z.string(),
  pda: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.coerce.date(),
});

export const MeOutputDto = z
  .object({
    publicKey: z.string(),
    name: z.string().nullable(),
    organization: OrganizationDto.nullable(),
    role: z.number().nullable(),
  })
  .nullable();

export type MeOutput = z.infer<typeof MeOutputDto>;
