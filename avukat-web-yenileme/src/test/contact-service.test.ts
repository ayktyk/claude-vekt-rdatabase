import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitCallbackRequest, submitContactForm } from "@/lib/contact-service";
import { ContactServiceError } from "@/types/contact";

const validPayload = {
  adsoyad: "Ada Lovelace",
  email: "ada@example.com",
  mesaj: "Iletisim formu test mesaji.",
  kvkkOnay: true,
  website: "",
};

const validCallbackPayload = {
  adsoyad: "Ada Lovelace",
  telefon: "05551234567",
  konu: "Ise iade",
  mesaj: "Geri aranmak istiyorum.",
  kvkkOnay: true,
  website: "",
};

describe("contact service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it("fails clearly when the endpoint is not configured", async () => {
    await expect(submitContactForm(validPayload)).rejects.toMatchObject<ContactServiceError>({
      code: "not_configured",
    });
  });

  it("sends the contact form payload to the configured endpoint", async () => {
    vi.stubEnv("VITE_CONTACT_FORM_ENDPOINT", "https://api.example.test/contact");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    await submitContactForm(validPayload);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/contact",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining('"source":"website-contact-form"'),
      }),
    );
  });

  it("sends the callback form payload to the configured endpoint", async () => {
    vi.stubEnv("VITE_CONTACT_FORM_ENDPOINT", "https://api.example.test/contact");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    await submitCallbackRequest(validCallbackPayload);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/contact",
      expect.objectContaining({
        body: expect.stringContaining('"source":"website-callback-form"'),
      }),
    );
  });

  it("rate limits repeated submissions for the same form for 60 seconds", async () => {
    vi.stubEnv("VITE_CONTACT_FORM_ENDPOINT", "https://api.example.test/contact");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    await submitContactForm(validPayload);

    await expect(submitContactForm(validPayload)).rejects.toMatchObject<ContactServiceError>({
      code: "rate_limit",
    });
  });

  it("does not share browser cooldown between contact and callback forms", async () => {
    vi.stubEnv("VITE_CONTACT_FORM_ENDPOINT", "https://api.example.test/contact");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    await submitContactForm(validPayload);
    await submitCallbackRequest(validCallbackPayload);

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
