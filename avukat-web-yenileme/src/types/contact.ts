export type ContactFormPayload = {
  adsoyad: string;
  email: string;
  mesaj: string;
  kvkkOnay: boolean;
  website?: string;
};

export type CallbackRequestPayload = {
  adsoyad: string;
  telefon: string;
  konu?: string;
  mesaj?: string;
  kvkkOnay: boolean;
  website?: string;
};

export type EvaluationRequestPayload = {
  adsoyad: string;
  email?: string;
  telefon?: string;
  konu?: string;
  mesaj?: string;
  kvkkOnay: boolean;
  website?: string;
};

export type InquiryPayload = {
  adsoyad: string;
  email?: string;
  telefon?: string;
  konu?: string;
  mesaj?: string;
  kvkkOnay: boolean;
  website?: string;
  source: "website-contact-form" | "website-callback-form" | "website-evaluation-form";
};

export type ContactServiceErrorCode =
  | "invalid"
  | "consent_required"
  | "spam_detected"
  | "rate_limit"
  | "not_configured"
  | "request_failed";

export class ContactServiceError extends Error {
  constructor(
    public readonly code: ContactServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ContactServiceError";
  }
}
