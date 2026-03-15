import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getLegalUpdateBySlug,
  listLatestLegalUpdates,
  listLegalUpdates,
  resetLegalUpdatesRepositoryCache,
} from "@/lib/legal-updates-repository";

describe("legal updates repository", () => {
  beforeEach(() => {
    resetLegalUpdatesRepositoryCache();
  });

  afterEach(() => {
    resetLegalUpdatesRepositoryCache();
  });

  it("returns local legal updates sorted by publication date", async () => {
    const items = await listLegalUpdates();

    expect(items).toHaveLength(6);
    expect(items[0]?.slug).toBe("yargitay-emsal-karar-kira-sozlesmesi-cekilmezlik-hali-olaganustu-fesih");
    expect(items[1]?.slug).toBe("tahliye-taahhudu-gecerlilik-sartlari-yargitay-kararlari");
    expect(items[2]?.slug).toBe("imzali-bordroda-fazla-mesai-hanesi-bossa-isci-delil-ile-ispat");
  });

  it("returns the latest legal updates with a limit", async () => {
    const items = await listLatestLegalUpdates(2);

    expect(items).toHaveLength(2);
  });

  it("finds an update by slug", async () => {
    const item = await getLegalUpdateBySlug("yargitay-fazla-mesai-karari-2026");

    expect(item?.title).toBe("Yargıtay'dan Fazla Mesai Hesabına İlişkin Yeni Değerlendirme");
  });

  it("preserves wrapped titles and folded excerpts from markdown frontmatter", async () => {
    const item = await getLegalUpdateBySlug("yargitay-emsal-karar-kira-sozlesmesi-cekilmezlik-hali-olaganustu-fesih");

    expect(item?.title).toBe(
      "Yargıtay'dan Emsal Karar: Kira Sözleşmelerinde 'Çekilmezlik Hali' ve Olağanüstü Fesih",
    );
    expect(item?.excerpt).toContain("olağanüstü fesih yoluna gidilebilecektir");
  });
});
