import { authRepository } from "../repositories/auth.repository";
import type { MeProjection } from "../repositories/auth.repository.types";

export async function getMeUseCase(input: {
  publicKey: string;
  organizationId: string;
}): Promise<MeProjection | null> {
  return authRepository.findMe(input);
}
