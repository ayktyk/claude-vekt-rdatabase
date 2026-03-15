import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

const renderAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(<App />);
};

describe("app routing", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("renders the blog index route", async () => {
    renderAt("/blog");

    expect(await screen.findByRole("heading", { name: "Blog Yazıları" })).toBeInTheDocument();
    expect(screen.getByText("Ana sayfaya dön")).toBeInTheDocument();
  });

  it("renders a blog detail route", async () => {
    renderAt("/blog/ise-iade-arabuluculukta-kritik-noktalar");

    expect(await screen.findByRole("heading", { name: "İşe İade Arabuluculukta Kritik Noktalar" })).toBeInTheDocument();
    expect(screen.getAllByText("Blog listesine dön")[0]).toBeInTheDocument();
  });

  it("renders the legal updates index route", async () => {
    renderAt("/guncel-hukuk-gundemi");

    expect(await screen.findByRole("heading", { name: "Güncel Hukuk Gündemi" })).toBeInTheDocument();
  });

  it("renders the kvkk legal page route", async () => {
    renderAt("/kvkk-aydinlatma");

    expect(await screen.findByRole("heading", { name: "KVKK Aydınlatma Metni" })).toBeInTheDocument();
  });

  it("renders not found for unknown routes", async () => {
    renderAt("/olmayan-sayfa");

    expect(await screen.findByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByText("Sayfa bulunamadı")).toBeInTheDocument();
  });
});
