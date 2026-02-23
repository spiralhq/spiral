import { orgsRepository } from "../repositories/orgs.repository";
import type { ListMineOutput } from "../dtos/list-mine.dto";

export async function listMyOrganizationsUseCase(input: {
  publicKey: string;
  currentOrganizationId: string;
}): Promise<ListMineOutput> {
  const organizations = await orgsRepository.findOrganizationsByUser({
    userPublicKey: input.publicKey,
  });

  return organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    pda: org.pda,
    role: org.role,
    isActive: org.id === input.currentOrganizationId,
  }));
}
