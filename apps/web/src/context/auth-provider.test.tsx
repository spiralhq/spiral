import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth-provider";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

const mockQueryOptions = vi.fn();

vi.mock("@/utils/trpc", () => ({
  trpc: {
    auth: {
      getMe: {
        queryOptions: () => mockQueryOptions(),
      },
    },
  },
}));

vi.mock("@/components/loader", () => ({
  default: () => <div data-testid="loader">Loading...</div>,
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loader while session is loading", async () => {
    mockQueryOptions.mockReturnValue({
      queryKey: ["auth", "getMe"],
      queryFn: () => new Promise(() => {}),
    });

    renderWithProviders(
      <AuthProvider>
        <div data-testid="child">Protected content</div>
      </AuthProvider>,
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders children when session is loaded successfully", async () => {
    const sessionData = {
      publicKey: "wallet123",
      name: "Alice",
      organization: { id: "org-1" },
      role: 1,
    };

    mockQueryOptions.mockReturnValue({
      queryKey: ["auth", "getMe"],
      queryFn: () => Promise.resolve(sessionData),
    });

    renderWithProviders(
      <AuthProvider>
        <div data-testid="child">Protected content</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  it("redirects to /login when session fetch returns null", async () => {
    mockQueryOptions.mockReturnValue({
      queryKey: ["auth", "getMe"],
      queryFn: () => Promise.resolve(null),
    });

    renderWithProviders(
      <AuthProvider>
        <div>Protected</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to /login when session fetch errors", async () => {
    mockQueryOptions.mockReturnValue({
      queryKey: ["auth", "getMe"],
      queryFn: () => Promise.reject(new Error("Unauthorized")),
    });

    renderWithProviders(
      <AuthProvider>
        <div>Protected</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
