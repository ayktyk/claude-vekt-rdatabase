import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getAuth } from "../../api/cms/auth";
import { GET as getCallback } from "../../api/cms/callback";

describe("cms oauth api", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("redirects to GitHub authorize from the auth endpoint and stores oauth context", async () => {
    process.env.GITHUB_CLIENT_ID = "github_client_id";

    const response = await getAuth(
      new Request("https://vegahukukistanbul.com/api/cms/auth", {
        headers: {
          referer: "https://www.vegahukukistanbul.com/admin/#/",
        },
      }),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("https://github.com/login/oauth/authorize");
    expect(response.headers.get("set-cookie")).toContain("cms_oauth_context=");
    expect(response.headers.get("set-cookie")).toContain("www.vegahukukistanbul.com");
  });

  it("returns a success message page after exchanging the GitHub code", async () => {
    process.env.GITHUB_CLIENT_ID = "github_client_id";
    process.env.GITHUB_CLIENT_SECRET = "github_client_secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "github_access_token" }),
      }),
    );

    const cookieValue = encodeURIComponent(
      JSON.stringify({
        state: "test-state",
        origin: "https://www.vegahukukistanbul.com",
      }),
    );

    const response = await getCallback(
      new Request("https://vegahukukistanbul.com/api/cms/callback?code=test-code&state=test-state", {
        headers: {
          cookie: `cms_oauth_context=${cookieValue}`,
        },
      }),
    );

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("authorizing:github");
    expect(body).toContain("authorization:github:success");
    expect(body).toContain("github_access_token");
    expect(body).toContain('finish(message && message.origin ? message.origin : "*")');
  });
});
