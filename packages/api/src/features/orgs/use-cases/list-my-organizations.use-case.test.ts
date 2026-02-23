import { describe, it, expect, vi, beforeEach } from "vitest";
import { listMyOrganizationsUseCase } from "./list-my-organizations.use-case";
import { orgsRepository } from "../repositories/orgs.repository";

vi.mock("../repositories/orgs.repository", () => ({
  orgsRepository: {
    findOrganizationsByUser: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(orgsRepository);

describe("listMyOrganizationsUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns organizations with isActive flag for current org", async () => {
    mockedRepo.findOrganizationsByUser.mockResolvedValue([
      { id: "org-1", name: "Org 1", slug: "org-1", pda: "pda-1", role: 1 },
      { id: "org-2", name: "Org 2", slug: "org-2", pda: "pda-2", role: 2 },
    ]);

    const result = await listMyOrganizationsUseCase({
      publicKey: "wallet123",
      currentOrganizationId: "org-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "org-1",
      name: "Org 1",
      slug: "org-1",
      pda: "pda-1",
      role: 1,
      isActive: true,
    });
    expect(result[1]).toEqual({
      id: "org-2",
      name: "Org 2",
      slug: "org-2",
      pda: "pda-2",
      role: 2,
      isActive: false,
    });
  });

  it("returns empty array when user has no organizations", async () => {
    mockedRepo.findOrganizationsByUser.mockResolvedValue([]);

    const result = await listMyOrganizationsUseCase({
      publicKey: "wallet-no-orgs",
      currentOrganizationId: "org-1",
    });

    expect(result).toEqual([]);
  });

  it("marks correct organization as active", async () => {
    mockedRepo.findOrganizationsByUser.mockResolvedValue([
      { id: "org-1", name: "Org 1", slug: "org-1", pda: "pda-1", role: 1 },
      { id: "org-2", name: "Org 2", slug: "org-2", pda: "pda-2", role: 2 },
      { id: "org-3", name: "Org 3", slug: "org-3", pda: "pda-3", role: 2 },
    ]);

    const result = await listMyOrganizationsUseCase({
      publicKey: "wallet123",
      currentOrganizationId: "org-2",
    });

    expect(result.find((o) => o.id === "org-1")?.isActive).toBe(false);
    expect(result.find((o) => o.id === "org-2")?.isActive).toBe(true);
    expect(result.find((o) => o.id === "org-3")?.isActive).toBe(false);
  });

  it("calls repository with correct publicKey", async () => {
    mockedRepo.findOrganizationsByUser.mockResolvedValue([]);

    await listMyOrganizationsUseCase({
      publicKey: "my-wallet-key",
      currentOrganizationId: "org-1",
    });

    expect(mockedRepo.findOrganizationsByUser).toHaveBeenCalledWith({
      userPublicKey: "my-wallet-key",
    });
  });
});
