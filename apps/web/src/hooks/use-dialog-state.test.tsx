import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useDialogState from "./use-dialog-state";

describe("useDialogState", () => {
  it("defaults to null when no initial state provided", () => {
    const { result } = renderHook(() => useDialogState());
    expect(result.current[0]).toBeNull();
  });

  it("accepts a string initial state", () => {
    const { result } = renderHook(() => useDialogState("edit"));
    expect(result.current[0]).toBe("edit");
  });

  it("accepts a boolean initial state", () => {
    const { result } = renderHook(() => useDialogState(true));
    expect(result.current[0]).toBe(true);
  });

  it("toggles open: sets value when different from current", () => {
    const { result } = renderHook(() => useDialogState<string>());

    act(() => {
      result.current[1]("create");
    });
    expect(result.current[0]).toBe("create");
  });

  it("toggles closed: sets null when same value passed again", () => {
    const { result } = renderHook(() => useDialogState("edit"));

    act(() => {
      result.current[1]("edit");
    });
    expect(result.current[0]).toBeNull();
  });

  it("switches between different values", () => {
    const { result } = renderHook(() => useDialogState<string>());

    act(() => {
      result.current[1]("create");
    });
    expect(result.current[0]).toBe("create");

    act(() => {
      result.current[1]("edit");
    });
    expect(result.current[0]).toBe("edit");
  });

  it("closes when setting null explicitly", () => {
    const { result } = renderHook(() => useDialogState("open"));

    act(() => {
      result.current[1](null);
    });
    expect(result.current[0]).toBeNull();
  });

  it("opening from null works correctly", () => {
    const { result } = renderHook(() => useDialogState<string>(null));

    act(() => {
      result.current[1]("dialog-a");
    });
    expect(result.current[0]).toBe("dialog-a");

    act(() => {
      result.current[1]("dialog-a");
    });
    expect(result.current[0]).toBeNull();

    act(() => {
      result.current[1]("dialog-a");
    });
    expect(result.current[0]).toBe("dialog-a");
  });
});
