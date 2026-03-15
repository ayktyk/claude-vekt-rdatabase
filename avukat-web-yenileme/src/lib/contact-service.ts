import {
  ContactServiceError,
  type CallbackRequestPayload,
  type ContactFormPayload,
  type EvaluationRequestPayload,
  type InquiryPayload,
} from "@/types/contact";

const CONTACT_RATE_LIMIT_KEY_PREFIX = "vega-hukuk-contact-last-submit-at";
const CONTACT_RATE_LIMIT_WINDOW_MS = 60_000;

const readEnv = (key: keyof ImportMetaEnv) => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
};

const inferDefaultEndpoint = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const { hostname } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  return isLocal ? "" : "/api/contact";
};

const getContactConfig = () => ({
  endpoint: readEnv("VITE_CONTACT_FORM_ENDPOINT") || inferDefaultEndpoint(),
  token: readEnv("VITE_CONTACT_FORM_TOKEN"),
});

const normalize = (value: string | undefined) => value?.trim() ?? "";
const getRateLimitKey = (source: InquiryPayload["source"]) => `${CONTACT_RATE_LIMIT_KEY_PREFIX}:${source}`;

const getRemainingCooldownMs = (source: InquiryPayload["source"]) => {
  if (typeof window === "undefined") {
    return 0;
  }

  const lastSubmitAt = window.localStorage.getItem(getRateLimitKey(source));
  if (!lastSubmitAt) {
    return 0;
  }

  const diff = Date.now() - Number(lastSubmitAt);
  return diff < CONTACT_RATE_LIMIT_WINDOW_MS ? CONTACT_RATE_LIMIT_WINDOW_MS - diff : 0;
};

const markSubmittedNow = (source: InquiryPayload["source"]) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(getRateLimitKey(source), String(Date.now()));
  }
};

const validateInquiryPayload = (payload: InquiryPayload) => {
  const adsoyad = normalize(payload.adsoyad);
  const email = normalize(payload.email);
  const telefon = normalize(payload.telefon);
  const konu = normalize(payload.konu);
  const mesaj = normalize(payload.mesaj);

  if (!adsoyad) {
    throw new ContactServiceError("invalid", "Lütfen ad soyad bilginizi girin.");
  }

  if (!email && !telefon) {
    throw new ContactServiceError("invalid", "En az bir iletişim bilgisi girin.");
  }

  if (payload.source === "website-contact-form" && !email) {
    throw new ContactServiceError("invalid", "İletişim formunda e-posta zorunludur.");
  }

  if (payload.source === "website-callback-form" && !telefon) {
    throw new ContactServiceError("invalid", "Ön değerlendirme formunda telefon zorunludur.");
  }

  if (payload.source === "website-evaluation-form" && !email && !telefon) {
    throw new ContactServiceError("invalid", "Telefon veya e-posta bilgilerinden en az birini girin.");
  }

  if (!mesaj && !konu) {
    throw new ContactServiceError("invalid", "Lütfen kısa bir not veya konu girin.");
  }

  if (!payload.kvkkOnay) {
    throw new ContactServiceError("consent_required", "Gönderim için KVKK onayı gereklidir.");
  }

  if (payload.website && payload.website.trim().length > 0) {
    throw new ContactServiceError("spam_detected", "Gönderim doğrulanamadı.");
  }

  const remainingMs = getRemainingCooldownMs(payload.source);
  if (remainingMs > 0) {
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    throw new ContactServiceError("rate_limit", `Lütfen ${remainingSeconds} saniye sonra tekrar deneyin.`);
  }

  return {
    adsoyad,
    email: email || undefined,
    telefon: telefon || undefined,
    konu: konu || undefined,
    mesaj: mesaj || undefined,
    source: payload.source,
  };
};

const submitInquiry = async (payload: InquiryPayload) => {
  const { endpoint, token } = getContactConfig();
  const sanitized = validateInquiryPayload(payload);

  if (!endpoint) {
    throw new ContactServiceError(
      "not_configured",
      "İletişim endpoint'i henüz tanımlı değil. Şimdilik telefon, e-posta veya WhatsApp kullanın.",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      ...sanitized,
      submittedAt: new Date().toISOString(),
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    }),
  });

  if (!response.ok) {
    const responsePayload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ContactServiceError(
      "request_failed",
      responsePayload?.message ?? "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.",
    );
  }

  markSubmittedNow(payload.source);
};

export const submitContactForm = async (payload: ContactFormPayload) =>
  submitInquiry({
    ...payload,
    source: "website-contact-form",
  });

export const submitCallbackRequest = async (payload: CallbackRequestPayload) =>
  submitInquiry({
    ...payload,
    source: "website-callback-form",
  });

export const submitEvaluationRequest = async (payload: EvaluationRequestPayload) =>
  submitInquiry({
    ...payload,
    source: "website-evaluation-form",
  });
