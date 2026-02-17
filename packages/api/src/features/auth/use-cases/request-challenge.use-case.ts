import { randomBytes } from "node:crypto";
import { authRepository } from "../repositories/auth.repository";

export async function requestChallengeUseCase(input: {
  publicKey: string;
}): Promise<{ message: string; nonce: string }> {
  const nonce = randomBytes(16).toString("hex");
  const message = `Spiral Auth\nNonce: ${nonce}\nWallet: ${input.publicKey}`;

  await authRepository.createChallenge({
    publicKey: input.publicKey,
    nonce,
    message,
    expiresAt: new Date(Date.now() + 1000 * 60 * 5),
  });

  return { message, nonce };
}
