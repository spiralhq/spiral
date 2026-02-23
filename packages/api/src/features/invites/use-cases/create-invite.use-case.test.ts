import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createInviteUseCase } from "./create-invite.use-case";
import { invitesRepository } from "../repositories/invites.repository";
import { resendGateway } from "../gateways/resend.gateway";
import { AppError } from "../../../core/errors/app-error";

vi.mock("@spiral/env/server", () => ({
  env: {
    WEB_URL: "https://app.spiral.dev",
    NODE_ENV: "test",
  },
}));

vi.mock("node:crypto", () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => "0".repeat(64)),
  })),
}));

vi.mock("../repositories/invites.repository", () => ({
  invitesRepository: {
    findOrganizationById: vi.fn(),
    createInvite: vi.fn(),
  },
}));

vi.mock("../gateways/resend.gateway", () => ({
  resendGateway: {
    sendInviteEmail: vi.fn(),
  },
}));

const mockedRepo = vi.mocked(invitesRepository);
const mockedResend = vi.mocked(resendGateway);

describe("createInviteUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws NOT_FOUND when organization does not exist", async () => {
    mockedRepo.findOrganizationById.mockResolvedValue(null);

    try {
      await createInviteUseCase({
        email: "test@example.com",
        role: 2,
        organizationId: "non-existent-org",
      });
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.code).toBe("NOT_FOUND");
      expect(appErr.i18nKey).toBe("errors.orgs.not-found");
    }
  });

  it("creates invite and sends email on success", async () => {
    mockedRepo.findOrganizationById.mockResolvedValue({
      id: "org-1",
      name: "Test Organization",
      pda: "org-pda",
    });
    mockedRepo.createInvite.mockResolvedValue("invite-uuid-123");

    const result = await createInviteUseCase({
      email: "invitee@example.com",
      role: 2,
      organizationId: "org-1",
    });

    expect(result).toEqual({
      success: true,
      inviteId: "invite-uuid-123",
    });
  });

  it("calls createInvite with correct parameters", async () => {
    mockedRepo.findOrganizationById.mockResolvedValue({
      id: "org-1",
      name: "Test Organization",
      pda: "org-pda",
    });
    mockedRepo.createInvite.mockResolvedValue("invite-uuid-123");

    await createInviteUseCase({
      email: "invitee@example.com",
      role: 1,
      organizationId: "org-1",
    });

    expect(mockedRepo.createInvite).toHaveBeenCalledWith({
      token: "0".repeat(64),
      organizationId: "org-1",
      role: 1,
      expiresAt: new Date("2025-01-08T00:00:00.000Z"), // 7 days later
    });
  });

  it("sends email with correct invite URL", async () => {
    mockedRepo.findOrganizationById.mockResolvedValue({
      id: "org-1",
      name: "My Org",
      pda: "org-pda",
    });
    mockedRepo.createInvite.mockResolvedValue("invite-uuid-123");

    await createInviteUseCase({
      email: "user@example.com",
      role: 2,
      organizationId: "org-1",
    });

    expect(mockedResend.sendInviteEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      organizationName: "My Org",
      inviteUrl: `https://app.spiral.dev/login?invite=${"0".repeat(64)}`,
    });
  });

  it("uses organization name in email", async () => {
    mockedRepo.findOrganizationById.mockResolvedValue({
      id: "org-1",
      name: "Acme Corp",
      pda: "org-pda",
    });
    mockedRepo.createInvite.mockResolvedValue("invite-uuid-123");

    await createInviteUseCase({
      email: "user@example.com",
      role: 2,
      organizationId: "org-1",
    });

    expect(mockedResend.sendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationName: "Acme Corp",
      }),
    );
  });
});
