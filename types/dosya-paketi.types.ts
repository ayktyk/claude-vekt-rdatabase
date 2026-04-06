/**
 * 5 Ajanli Stratejik Analiz Sistemi - Tip Tanimlari
 *
 * Bu dosya, arastirma pipeline'indan gelen verilerin
 * 5 ajanli sisteme aktarilmasi icin kullanilan tipleri tanimlar.
 */

/** Arastirma pipeline'indan gelen tam paket */
export interface ResearchPackage {
  /** Benzersiz paket ID'si */
  id: string;

  /** Dava bilgileri */
  dava: {
    davaId: string;
    muvekkil: string;
    davaTuru: string;
    ozet: string;
    kritikNokta: string;
  };

  /** Usul raporu (Ajan 1 ciktisi) */
  usulRaporu?: string;

  /** Arastirma raporu (Ajan 2 ciktisi) */
  arastirmaRaporu?: string;

  /** Yargi CLI'dan gelen kararlar */
  yargiKararlari?: YargiKarari[];

  /** Mevzuat CLI'dan gelen maddeler */
  mevzuatMaddeleri?: MevzuatMaddesi[];

  /** Vektor DB'den gelen sonuclar */
  vektorSonuclari?: VektorSonuc[];

  /** NotebookLM'den gelen bulgular */
  notebookBulgulari?: string;

  /** Muvekkil belgeleri ve gorusme notlari */
  belgeler?: Belge[];

  /** Olusturulma tarihi */
  olusturulmaTarihi: string;
}

export interface YargiKarari {
  documentId: string;
  daire: string;
  tarih: string;
  esasNo: string;
  kararNo: string;
  ozet: string;
  tamMetin?: string;
}

export interface MevzuatMaddesi {
  kanunAdi: string;
  maddeNo: string;
  icerik: string;
  mevzuatId?: string;
}

export interface VektorSonuc {
  kaynak: string;
  icerik: string;
  benzerlikSkoru: number;
  kategori?: string;
}

export interface Belge {
  ad: string;
  tur: 'gorusme-notu' | 'sozlesme' | 'dilekce' | 'rapor' | 'diger';
  icerik: string;
}

/** Her perspektif ajanin cikti formati */
export interface AgentRapor {
  ajanAdi: string;
  perspektif: 'davaci' | 'davali' | 'bilirkisi' | 'hakim';
  icerik: string;
  tamamlanmaTarihi: string;
  basarili: boolean;
  hata?: string;
}

/** Sentez ajaninin nihai ciktisi */
export interface SentezRapor {
  dosyaOzeti: string;
  enGucluArgumanlar: string[];
  enBuyukRiskler: { risk: string; cozum: string }[];
  genelStrateji: string;
  dilekceRevizyon: string[];
  durusmaStratejisi: string;
  sonTavsiye: 'kirmizi-alarm' | 'yesil-isik' | 'sartli-ilerleme';
}

/** 5 ajanli analiz sonuc paketi */
export interface FiveAgentResult {
  timestamp: string;
  researchPackageId: string;
  davaciRapor: AgentRapor;
  davaliRapor: AgentRapor;
  bilirkisiRapor: AgentRapor;
  hakimRapor: AgentRapor;
  sentezRapor: string;
  basarili: boolean;
  toplamSure?: number;
}
