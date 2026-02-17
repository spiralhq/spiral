import { z } from "zod";

export const RequestChallengeInputDto = z.object({
  publicKey: z.string().min(32),
});

export const RequestChallengeOutputDto = z.object({
  message: z.string(),
  nonce: z.string(),
});

export type RequestChallengeInput = z.infer<typeof RequestChallengeInputDto>;
export type RequestChallengeOutput = z.infer<typeof RequestChallengeOutputDto>;
