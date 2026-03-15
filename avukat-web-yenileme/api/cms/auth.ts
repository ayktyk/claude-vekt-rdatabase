const getEnv = (key: string) => process.env[key]?.trim() ?? "";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const getOrigin = (request: Request) => new URL(request.url).origin;

const buildCookie = (name: string, value: string, maxAge: number) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
};

const getRequestOrigin = (request: Request) => {
  const headerOrigin = request.headers.get("origin")?.trim();
  if (headerOrigin) {
    return headerOrigin;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return getOrigin(request);
    }
  }

  return getOrigin(request);
};

export async function GET(request: Request) {
  const clientId = getEnv("GITHUB_CLIENT_ID");

  if (!clientId) {
    return json({ ok: false, message: "GITHUB_CLIENT_ID tanımlı değil." }, 500);
  }

  const state = crypto.randomUUID().replaceAll("-", "");
  const redirectUri = `${getOrigin(request)}/api/cms/callback`;
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  const openerOrigin = getRequestOrigin(request);
  const oauthContext = JSON.stringify({ state, origin: openerOrigin });

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "repo");
  authorizeUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      location: authorizeUrl.toString(),
      "set-cookie": buildCookie("cms_oauth_context", oauthContext, 600),
    },
  });
}
