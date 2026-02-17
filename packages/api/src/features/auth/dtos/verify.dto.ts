import { z } from "zod";

export const VerifyInputDto = z.object({
  publicKey: z.string().min(32),
  signature: z.string().min(10),
  nonce: z.string().min(10),
  inviteToken: z.string().optional(),
});

export const VerifyOutputDto = z.object({
  success: z.literal(true),
});

export type VerifyInput = z.infer<typeof VerifyInputDto>;
export type VerifyOutput = z.infer<typeof VerifyOutputDto>;
