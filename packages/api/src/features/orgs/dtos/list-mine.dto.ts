import { z } from "zod";

export const ListMineOrganizationItemDto = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  pda: z.string(),
  role: z.number(),
  isActive: z.boolean(),
});

export const ListMineOutputDto = z.array(ListMineOrganizationItemDto);

export type ListMineOrganizationItem = z.infer<typeof ListMineOrganizationItemDto>;
export type ListMineOutput = z.infer<typeof ListMineOutputDto>;
