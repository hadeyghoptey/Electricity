import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiUrl, apiFetch } from "./api";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_API_URL;
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = ORIGINAL_URL;
});

describe("apiUrl", () => {
  it("returns the path as-is when no base URL is set", () => {
    expect(apiUrl("/api/config")).toBe("/api/config");
  });

  it("prepends the base URL when set", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
    expect(apiUrl("/api/config")).toBe("http://localhost:4000/api/config");
  });

  it("handles trailing slash in base URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/";
    expect(apiUrl("/api/config")).toBe("http://localhost:4000//api/config");
  });
});

describe("apiFetch", () => {
  it("calls fetch with the resolved URL", async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mock);

    await apiFetch("/api/test");

    expect(mock).toHaveBeenCalledWith("/api/test", undefined);
    vi.unstubAllGlobals();
  });

  it("throws on non-ok response", async () => {
    const mock = vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" });
    vi.stubGlobal("fetch", mock);

    await expect(apiFetch("/api/test")).rejects.toThrow("API error: Not Found");
    vi.unstubAllGlobals();
  });

  it("passes options through to fetch", async () => {
    const mock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mock);

    const options = { method: "POST", headers: { "Content-Type": "application/json" } };
    await apiFetch("/api/test", options);

    expect(mock).toHaveBeenCalledWith("/api/test", options);
    vi.unstubAllGlobals();
  });

  it("uses NEXT_PUBLIC_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
    const mock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mock);

    await apiFetch("/api/test");

    expect(mock).toHaveBeenCalledWith("http://localhost:4000/api/test", undefined);
    vi.unstubAllGlobals();
  });
});
