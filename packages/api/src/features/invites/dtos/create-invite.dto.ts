import { z } from "zod";

export const CreateInviteInputDto = z.object({
  email: z.email(),
  role: z.number().min(1).max(2).default(2),
});

export const CreateInviteOutputDto = z.object({
  success: z.literal(true),
  inviteId: z.uuid(),
});

export type CreateInviteInput = z.infer<typeof CreateInviteInputDto>;
export type CreateInviteOutput = z.infer<typeof CreateInviteOutputDto>;
