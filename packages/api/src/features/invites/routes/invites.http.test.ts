import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { invitesHttp } from "./invites.http";
import { createInviteUseCase } from "../use-cases/create-invite.use-case";

vi.mock("@spiral/env/server", () => ({
  env: {
    JWT_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("hono/cookie", () => ({
  getCookie: vi.fn(),
}));

vi.mock("hono/jwt", () => ({
  verify: vi.fn(),
}));

vi.mock("../use-cases/create-invite.use-case", () => ({
  createInviteUseCase: vi.fn(),
}));

const mockedGetCookie = vi.mocked(getCookie);
const mockedVerify = vi.mocked(verify);
const mockedCreateInvite = vi.mocked(createInviteUseCase);

describe("invitesHttp routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /", () => {
    it("returns 401 when not authenticated", async () => {
      mockedGetCookie.mockReturnValue(undefined);

      const res = await invitesHttp.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", role: 2 }),
      });
      expect(res.status).toBe(401);
    });

    it("returns 403 when user is not admin", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 2, // Not admin (1)
      });

      const res = await invitesHttp.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", role: 2 }),
      });
      expect(res.status).toBe(403);
    });

    it("creates invite when admin", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1, // Admin
      });
      mockedCreateInvite.mockResolvedValue({
        success: true,
        inviteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      const res = await invitesHttp.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", role: 2 }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.success).toBe(true);
      expect(body.inviteId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("calls use case with correct parameters", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "my-org",
        role: 1,
      });
      mockedCreateInvite.mockResolvedValue({
        success: true,
        inviteId: "550e8400-e29b-41d4-a716-446655440000",
      });

      await invitesHttp.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invitee@example.com", role: 1 }),
      });

      expect(mockedCreateInvite).toHaveBeenCalledWith({
        email: "invitee@example.com",
        role: 1,
        organizationId: "my-org",
      });
    });

    it("returns 400 for invalid email", async () => {
      mockedGetCookie.mockReturnValue("valid-token");
      mockedVerify.mockResolvedValue({
        sub: "wallet123",
        organizationId: "org-1",
        role: 1,
      });

      const res = await invitesHttp.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-email", role: 2 }),
      });
      expect(res.status).toBe(400);
    });
  });
});
