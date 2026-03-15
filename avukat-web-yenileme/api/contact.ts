const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_MESSAGE_LENGTH = 4_000;
const requestLog = new Map<string, number>();

type ContactRequestBody = {
  adsoyad?: string;
  email?: string;
  telefon?: string;
  konu?: string;
  mesaj?: string;
  source?: string;
  submittedAt?: string;
  pageUrl?: string;
};

type ErrorCode =
  | "invalid_method"
  | "invalid_payload"
  | "origin_not_allowed"
  | "rate_limit"
  | "not_configured"
  | "mail_failed";

const getEnv = (key: string) => process.env[key]?.trim() ?? "";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const error = (status: number, code: ErrorCode, message: string) => json({ ok: false, code, message }, status);

const normalize = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "");

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getAllowedOrigins = (requestUrl: string) => {
  const configured = getEnv("CONTACT_ALLOWED_ORIGINS")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  return Array.from(new Set([...configured, new URL(requestUrl).origin]));
};

const isAllowedOrigin = (origin: string | null, requestUrl: string) => {
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins(requestUrl);
  return allowedOrigins.includes(normalizeOrigin(origin));
};

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
};

const assertRateLimit = (request: Request, source: string) => {
  const key = `${getClientIp(request)}:${source}`;
  const now = Date.now();
  const lastSeen = requestLog.get(key) ?? 0;

  if (now - lastSeen < RATE_LIMIT_WINDOW_MS) {
    throw error(429, "rate_limit", "Lütfen kısa bir süre sonra tekrar deneyin.");
  }

  requestLog.set(key, now);
};

const validateBody = (body: ContactRequestBody) => {
  const adsoyad = normalize(body.adsoyad);
  const email = normalize(body.email);
  const telefon = normalize(body.telefon);
  const konu = normalize(body.konu);
  const mesaj = normalize(body.mesaj);
  const source = normalize(body.source) || "website-contact-form";

  if (!adsoyad) {
    throw error(400, "invalid_payload", "Ad soyad zorunludur.");
  }

  if (!email && !telefon) {
    throw error(400, "invalid_payload", "En az bir iletişim bilgisi gereklidir.");
  }

  if (source === "website-contact-form" && !email) {
    throw error(400, "invalid_payload", "İletişim formunda e-posta zorunludur.");
  }

  if (source === "website-callback-form" && !telefon) {
    throw error(400, "invalid_payload", "Ön değerlendirme formunda telefon zorunludur.");
  }

  if (source === "website-evaluation-form" && !email && !telefon) {
    throw error(400, "invalid_payload", "Telefon veya e-posta bilgilerinden en az birini girin.");
  }

  if (!mesaj && !konu) {
    throw error(400, "invalid_payload", "Mesaj veya konu bilgisi gereklidir.");
  }

  if (mesaj.length > MAX_MESSAGE_LENGTH) {
    throw error(400, "invalid_payload", "Mesaj çok uzun.");
  }

  return {
    adsoyad,
    email: email || undefined,
    telefon: telefon || undefined,
    konu: konu || undefined,
    mesaj: mesaj || undefined,
    source,
    submittedAt: normalize(body.submittedAt) || new Date().toISOString(),
    pageUrl: normalize(body.pageUrl),
  };
};

const sourceTitle = (source: string) => {
  if (source === "website-callback-form") {
    return "Ön değerlendirme talebi";
  }

  if (source === "website-evaluation-form") {
    return "Ücretsiz ön değerlendirme talebi";
  }

  return "İletişim formu mesajı";
};

const sendWithResend = async (body: ReturnType<typeof validateBody>) => {
  const apiKey = getEnv("RESEND_API_KEY");
  const to = getEnv("CONTACT_TO_EMAIL");
  const from = getEnv("CONTACT_FROM_EMAIL");

  if (!apiKey || !to || !from) {
    throw error(
      503,
      "not_configured",
      "Mail ayarları eksik. RESEND_API_KEY, CONTACT_TO_EMAIL ve CONTACT_FROM_EMAIL tanımlanmalı.",
    );
  }

  const title = sourceTitle(body.source);

  const html = `
    <h2>${escapeHtml(title)}</h2>
    <p><strong>Ad Soyad:</strong> ${escapeHtml(body.adsoyad)}</p>
    <p><strong>E-posta:</strong> ${escapeHtml(body.email || "Belirtilmedi")}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(body.telefon || "Belirtilmedi")}</p>
    <p><strong>Konu:</strong> ${escapeHtml(body.konu || "Belirtilmedi")}</p>
    <p><strong>Kaynak:</strong> ${escapeHtml(body.source)}</p>
    <p><strong>Gönderim Zamanı:</strong> ${escapeHtml(body.submittedAt)}</p>
    <p><strong>Sayfa:</strong> ${escapeHtml(body.pageUrl || "Belirtilmedi")}</p>
    <hr />
    <p>${escapeHtml(body.mesaj || "Mesaj bırakılmadı.").replaceAll("\n", "<br />")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${title} | ${body.adsoyad}`,
      html,
      text: [
        title,
        `Ad Soyad: ${body.adsoyad}`,
        `E-posta: ${body.email || "Belirtilmedi"}`,
        `Telefon: ${body.telefon || "Belirtilmedi"}`,
        `Konu: ${body.konu || "Belirtilmedi"}`,
        `Kaynak: ${body.source}`,
        `Gönderim Zamanı: ${body.submittedAt}`,
        `Sayfa: ${body.pageUrl || "Belirtilmedi"}`,
        "",
        body.mesaj || "Mesaj bırakılmadı.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Resend request failed", details);
    throw error(502, "mail_failed", "Mesaj iletilemedi. Lütfen daha sonra tekrar deneyin.");
  }

  return response.json();
};

export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers.get("origin"), request.url)) {
    return error(403, "origin_not_allowed", "Bu kaynaktan istek kabul edilmiyor.");
  }

  try {
    const body = validateBody((await request.json()) as ContactRequestBody);
    assertRateLimit(request, body.source);
    const result = await sendWithResend(body);

    return json({ ok: true, result });
  } catch (responseOrError) {
    if (responseOrError instanceof Response) {
      return responseOrError;
    }

    console.error("Contact API failed", responseOrError);
    return error(500, "mail_failed", "Mesaj iletilemedi. Lütfen daha sonra tekrar deneyin.");
  }
}

export async function GET() {
  return error(405, "invalid_method", "Bu endpoint sadece POST kabul eder.");
}
