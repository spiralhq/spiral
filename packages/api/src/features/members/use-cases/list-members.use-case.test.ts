import { describe, it, expect, vi, beforeEach } from "vitest";
import { listMembersUseCase } from "./list-members.use-case";
import { membersRepository } from "../repositories/members.repository";

vi.mock("../repositories/members.repository", () => ({
  membersRepository: {
    listWithQuery: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(membersRepository);

describe("listMembersUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated members from repository", async () => {
    const members = [
      { userPublicKey: "wallet1", name: "Alice", role: 1, pda: "pda1", createdAt: new Date() },
      { userPublicKey: "wallet2", name: null, role: 2, pda: "pda2", createdAt: new Date() },
    ];
    mockedRepo.listWithQuery.mockResolvedValue({ items: members, total: 2 });

    const result = await listMembersUseCase({ organizationId: "org-1" });

    expect(result.items).toEqual(members);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("returns empty result when no members", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 0 });

    const result = await listMembersUseCase({ organizationId: "empty-org" });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("calls repository with correct organizationId", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 0 });

    await listMembersUseCase({ organizationId: "my-org-id" });

    expect(mockedRepo.listWithQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "my-org-id",
      }),
    );
  });

  it("applies pagination parameters", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 100 });

    const result = await listMembersUseCase({
      organizationId: "org-1",
      page: 3,
      pageSize: 10,
    });

    expect(mockedRepo.listWithQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 20,
        limit: 10,
      }),
    );
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(10);
  });

  it("applies sort parameters", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 0 });

    const result = await listMembersUseCase({
      organizationId: "org-1",
      sortBy: "name",
      sortDir: "desc",
    });

    expect(mockedRepo.listWithQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: "name",
        sortDir: "desc",
      }),
    );
    expect(result.sortBy).toBe("name");
    expect(result.sortDir).toBe("desc");
  });

  it("uses default sort when sortBy not provided", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 0 });

    const result = await listMembersUseCase({ organizationId: "org-1" });

    expect(mockedRepo.listWithQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: "createdAt",
        sortDir: "desc",
      }),
    );
    expect(result.sortBy).toBe("createdAt");
  });

  it("rejects invalid sortBy and uses default", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 0 });

    const result = await listMembersUseCase({
      organizationId: "org-1",
      sortBy: "invalid",
    });

    expect(mockedRepo.listWithQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: "createdAt", // falls back to default
      }),
    );
    expect(result.sortBy).toBe("createdAt");
  });

  it("applies search parameter", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 0 });

    const result = await listMembersUseCase({
      organizationId: "org-1",
      q: "alice",
    });

    expect(mockedRepo.listWithQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "alice",
      }),
    );
    expect(result.q).toBe("alice");
  });

  it("applies filters parameter", async () => {
    mockedRepo.listWithQuery.mockResolvedValue({ items: [], total: 0 });

    const result = await listMembersUseCase({
      organizationId: "org-1",
      filters: { role: 1, hasPda: true },
    });

    expect(mockedRepo.listWithQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: { role: 1, hasPda: true },
      }),
    );
    expect(result.filters).toEqual({ role: 1, hasPda: true });
  });
});
