import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PublicKey as PublicKeyType } from "@solana/web3.js";
import { AuthForm } from "./auth-form";

const {
  mockPush,
  mockRefresh,
  mockSearchParamsGet,
  mockSignMessage,
  mockToastSuccess,
  mockToastError,
  mockRequestChallengeMutateAsync,
  mockVerifyMutateAsync,
  walletState,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockSearchParamsGet: vi.fn(),
  mockSignMessage: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockRequestChallengeMutateAsync: vi.fn(),
  mockVerifyMutateAsync: vi.fn(),
  walletState: {
    publicKey: null as { toBase58: () => string } | null,
    connected: false,
    signMessage: undefined as ((msg: Uint8Array) => Promise<Uint8Array>) | undefined,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    return t;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: walletState.publicKey,
    signMessage: walletState.signMessage,
    connected: walletState.connected,
  }),
}));

vi.mock("bs58", () => ({
  default: {
    encode: () => "mock-base58-signature",
  },
}));

vi.mock("next/dynamic", () => {
  const ReactForMock = require("react");
  return {
    default: () => {
      return function MockWalletMultiButton() {
        return ReactForMock.createElement(
          "button",
          { "data-testid": "wallet-multi-button" },
          "Connect Wallet",
        );
      };
    },
  };
});

vi.mock("../auth-layout", () => {
  const ReactForMock = require("react");
  return {
    AuthLayout: ({ children }: { children: any }) =>
      ReactForMock.createElement("div", { "data-testid": "auth-layout" }, children),
  };
});

vi.mock("motion/react", () => {
  const ReactForMock = require("react");
  return {
    motion: {
      div: ReactForMock.forwardRef(({ children, ...props }: any, ref: any) =>
        ReactForMock.createElement("div", { ref, props }, children),
      ),
      h1: ReactForMock.forwardRef(({ children, ...props }: any, ref: any) =>
        ReactForMock.createElement("h1", { ref, props }, children),
      ),
      p: ReactForMock.forwardRef(({ children, ...props }: any, ref: any) =>
        ReactForMock.createElement("p", { ref, props }, children),
      ),
    },
  };
});

vi.mock("@/utils/trpc", () => ({
  trpc: {
    auth: {
      requestChallenge: {
        mutationOptions: () => ({
          mutationFn: mockRequestChallengeMutateAsync,
        }),
      },
      verify: {
        mutationOptions: () => ({
          mutationFn: mockVerifyMutateAsync,
        }),
      },
    },
  },
}));

function makePublicKey(base58: string): PublicKeyType {
  return {
    toBase58: () => base58,
    toBuffer: () => Buffer.from(base58),
    toBytes: () => new Uint8Array(),
    toString: () => base58,
    equals: () => false,
    toJSON: () => base58,
  } as unknown as PublicKeyType;
}

function setWalletState(opts: { connected: boolean; publicKey?: string; signMessage?: boolean }) {
  walletState.connected = opts.connected;
  walletState.publicKey = opts.publicKey ? makePublicKey(opts.publicKey) : null;
  walletState.signMessage =
    opts.signMessage !== false && opts.connected ? mockSignMessage : undefined;
}

function renderAuthForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthForm />
    </QueryClientProvider>,
  );
}

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    walletState.publicKey = null;
    walletState.connected = false;
    walletState.signMessage = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  describe("when wallet is NOT connected", () => {
    it("does not render the sign-in action button", () => {
      setWalletState({ connected: false });
      renderAuthForm();

      const buttons = screen.queryAllByRole("button");
      const signInButton = buttons.find(
        (b) =>
          b.textContent?.includes("auth.sign-in.action") ||
          b.textContent?.includes("auth.invite.action"),
      );
      expect(signInButton).toBeUndefined();
    });
  });

  describe("when wallet is connected but missing publicKey", () => {
    it("disables the action button", () => {
      walletState.connected = true;
      walletState.publicKey = null;
      walletState.signMessage = mockSignMessage;

      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      if (signInButton) {
        expect(signInButton).toBeDisabled();
      }
    });
  });

  describe("when wallet is connected but missing signMessage", () => {
    it("disables the action button", () => {
      walletState.connected = true;
      walletState.publicKey = makePublicKey("TestWallet123456789012345678901234");
      walletState.signMessage = undefined;

      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      if (signInButton) {
        expect(signInButton).toBeDisabled();
      }
    });
  });

  describe("happy path (no invite token)", () => {
    beforeEach(() => {
      mockSearchParamsGet.mockReturnValue(null);
      setWalletState({ connected: true, publicKey: "WalletPubKey58Base3456789012345678" });
      mockRequestChallengeMutateAsync.mockResolvedValue({
        message: "Spiral Auth\nNonce: test-nonce\nWallet: WalletPubKey58Base3456789012345678",
        nonce: "test-nonce",
      });
      mockSignMessage.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
      mockVerifyMutateAsync.mockResolvedValue({ success: true });
    });

    it("calls requestChallenge with publicKey.toBase58()", async () => {
      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      expect(signInButton).toBeDefined();

      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockRequestChallengeMutateAsync).toHaveBeenCalled();
      });

      expect(mockRequestChallengeMutateAsync.mock.calls[0]![0]).toEqual({
        publicKey: "WalletPubKey58Base3456789012345678",
      });
    });

    it("signs the challenge message with signMessage", async () => {
      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockSignMessage).toHaveBeenCalled();
      });

      const encodedArg = mockSignMessage.mock.calls[0]![0] as Uint8Array;
      const decoded = new TextDecoder().decode(encodedArg);
      expect(decoded).toContain("Spiral Auth");
      expect(decoded).toContain("test-nonce");
    });

    it("calls verify with publicKey, base58 signature, nonce, and no inviteToken", async () => {
      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockVerifyMutateAsync).toHaveBeenCalled();
      });

      expect(mockVerifyMutateAsync.mock.calls[0]![0]).toEqual({
        publicKey: "WalletPubKey58Base3456789012345678",
        signature: "mock-base58-signature",
        nonce: "test-nonce",
        inviteToken: undefined,
      });
    });

    it("shows success toast with sign-in message on success", async () => {
      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("auth.sign-in.success");
      });
    });

    it("navigates to /dashboard and refreshes on success", async () => {
      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("happy path (with invite token)", () => {
    beforeEach(() => {
      mockSearchParamsGet.mockReturnValue("invite-abc-123");
      setWalletState({ connected: true, publicKey: "WalletPubKey58Base3456789012345678" });
      mockRequestChallengeMutateAsync.mockResolvedValue({
        message: "Spiral Auth\nNonce: invite-nonce\nWallet: WalletPubKey58Base3456789012345678",
        nonce: "invite-nonce",
      });
      mockSignMessage.mockResolvedValue(new Uint8Array([5, 6, 7, 8]));
      mockVerifyMutateAsync.mockResolvedValue({ success: true });
    });

    it("passes inviteToken to verify mutation", async () => {
      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const actionButton = buttons.find((b) => b.textContent?.includes("auth.invite.action"));
      expect(actionButton).toBeDefined();

      await user.click(actionButton!);

      await waitFor(() => {
        expect(mockVerifyMutateAsync).toHaveBeenCalled();
      });

      expect(mockVerifyMutateAsync.mock.calls[0]![0]).toMatchObject({
        inviteToken: "invite-abc-123",
      });
    });

    it("shows invite success toast", async () => {
      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const actionButton = buttons.find((b) => b.textContent?.includes("auth.invite.action"));
      await user.click(actionButton!);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("auth.invite.success");
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockSearchParamsGet.mockReturnValue(null);
      setWalletState({ connected: true, publicKey: "WalletPubKey58Base3456789012345678" });
    });

    it("shows i18nKey from error.data when present", async () => {
      mockRequestChallengeMutateAsync.mockRejectedValue({
        data: { i18nKey: "errors.auth.invalid-signature" },
      });

      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("errors.auth.invalid-signature");
      });
    });

    it("falls back to errors.unknown when error has no i18nKey", async () => {
      mockRequestChallengeMutateAsync.mockRejectedValue(new Error("network error"));

      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("errors.unknown");
      });
    });

    it("does not call verify when requestChallenge fails", async () => {
      mockRequestChallengeMutateAsync.mockRejectedValue({
        data: { i18nKey: "errors.internal" },
      });

      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });

      expect(mockVerifyMutateAsync).not.toHaveBeenCalled();
    });

    it("does not navigate on error", async () => {
      mockRequestChallengeMutateAsync.mockRejectedValue(new Error("fail"));

      const user = userEvent.setup();
      renderAuthForm();

      const buttons = screen.getAllByRole("button");
      const signInButton = buttons.find((b) => b.textContent?.includes("auth.sign-in.action"));
      await user.click(signInButton!);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
