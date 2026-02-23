import { z } from "zod";

export const SwitchOrgInputDto = z.object({
  organizationId: z.uuid(),
});

export const SwitchOrgOutputDto = z.object({
  success: z.literal(true),
});

export type SwitchOrgInput = z.infer<typeof SwitchOrgInputDto>;
export type SwitchOrgOutput = z.infer<typeof SwitchOrgOutputDto>;
