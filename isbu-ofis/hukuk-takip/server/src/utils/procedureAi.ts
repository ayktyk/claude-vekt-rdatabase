import { z } from 'zod'
import { callClaudeCli, hasClaudeCliConfig } from './claudeCli.js'

// ─── Types ───────────────────────────────────────────────────────────────────

type ProcedureAiInput = {
  caseTitle: string
  caseType: string
  caseDescription?: string | null
  courtName?: string | null
  criticalPointSummary?: string | null
  mainLegalAxis?: string | null
  lawyerDirection?: string | null
  briefingSummary?: string | null
}

type PrecheckResult = {
  courtType: string
  jurisdiction: string
  arbitrationRequired: boolean
  arbitrationBasis: string | null
  statuteOfLimitations: string
  specialPowerOfAttorney: boolean
  specialPowerOfAttorneyNote: string | null
  precheckPassed: boolean
  precheckNotes: string
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const precheckSchema = z.object({
  courtType: z.string().min(1),
  jurisdiction: z.string().min(1),
  arbitrationRequired: z.boolean(),
  arbitrationBasis: z.string().nullable(),
  statuteOfLimitations: z.string().min(1),
  specialPowerOfAttorney: z.boolean(),
  specialPowerOfAttorneyNote: z.string().nullable(),
  precheckPassed: z.boolean(),
  precheckNotes: z.string().min(1),
})

// ─── Dava Türüne Özel Rehber ─────────────────────────────────────────────────

function getCaseTypeSpecificGuidance(caseType: string): string {
  const normalized = caseType.toLowerCase().replace(/[\s-]+/gu, '_')

  const guidance: Record<string, string> = {
    tuketici: [
      'TUKETICI DAVASI OZEL KONTROL NOKTALARI:',
      '- Tuketici Hakem Heyeti (THH) basvuru siniri: 2025 yili icin 104.000 TL.',
      '  THH sinirininin altindaki uyusmazliklarda THH basvurusu zorunlu dava sartidir.',
      '- Dava degeri THH sinirinin ustundeyse dogrudan tuketici mahkemesine dava acilabilir.',
      '- Sigorta unsuru varsa: Sigorta Tahkim Komisyonu (STK) basvurusu alternatif/zorunlu yol olabilir.',
      '  STK basvuru limiti: 2025 icin yaklasik 30.000 TL (dogrulanmasi gerekir).',
      '  Sigortacilik Kanunu 5684 m.30 STK yolu.',
      '- Gorev ayrimi: tuketici mahkemesi (tuketici islemleri) vs asliye ticaret (sigortanin tacir tarafi).',
      '- 6502 sayili TKHK m.73/A: tuketici davalarinda arabuluculuk zorunlu (01.04.2024 sonrasi).',
      '- Zamanaasimi: TBK m.146 genel 10 yil veya ozel sureler.',
      '- Tuketici davalarinda harcsizlik avantaji: dava degeri belirli sinirin altindaysa harc yok.',
    ].join('\n'),

    tuketici_sigorta: [
      'TUKETICI + SIGORTA UYUSMAZLIGI OZEL KONTROL NOKTALARI:',
      '- Sigorta Tahkim Komisyonu (STK) basvurusu: 5684 sayili Sigortacilik Kanunu m.30.',
      '  STK basvurusu ihtiyari ama hizli ve etkin bir yoldur.',
      '  STK basvuru limiti ustu kararlar icin itiraz ve temyiz yollari mevcuttur.',
      '- Tuketici Hakem Heyeti (THH): sigorta uyusmazligi ayni zamanda tuketici islemi ise THH de alternatif.',
      '  THH siniri 2025: 104.000 TL (dogrulanmasi gerekir).',
      '- Gorevli mahkeme secimi kritik:',
      '  * Sigortali tuketici ise → tuketici mahkemesi.',
      '  * Ticari sigorta (tacirler arasi) ise → asliye ticaret mahkemesi.',
      '  * Zorunlu trafik sigortasi → hem tuketici hem ticaret mahkemesi gorevli olabilir (H17 ictihadina bak).',
      '- 6502 m.73/A arabuluculuk zorunlulugu tuketici mahkemesi secildiginde gecerli.',
      '- Sigorta tazminat davalarinda faiz: dava/temerrut tarihinden itibaren yasal faiz.',
      '- Sigorta police sartlari ve hasar dosyasi mutlaka incelenmeli.',
    ].join('\n'),

    sigorta: [
      'SIGORTA DAVASI OZEL KONTROL NOKTALARI:',
      '- Sigorta Tahkim Komisyonu (STK): 5684 m.30 uyarinca ihtiyari basvuru yolu.',
      '- Gorevli mahkeme: asliye ticaret (sigortaci tacir) veya tuketici mahkemesi (sigortali tuketici ise).',
      '- Zorunlu sigortalar (trafik, DASK): ozel usul kurallari.',
      '- Sigorta sozlesmesinden dogan davalarda zamanasimi: TTK m.1420 — 2 yil (rizikonun gerceklesmesinden) ve 6 yil (sozlesme tarihinden).',
      '- Hasar ihbar suresi ve police sartlari kontrol edilmeli.',
      '- Rucu davalari: sigortacinin ucuncu kisiye rucusu ayri degerlendirme gerektirir.',
    ].join('\n'),

    iscilik_alacagi: [
      'ISCILIK ALACAGI DAVASI OZEL KONTROL NOKTALARI:',
      '- Arabuluculuk zorunlu dava sarti: 7036 s. K. m.3.',
      '  Arabuluculuk son tutanagi olmadan dava acilamaz.',
      '- Zamanasimi: 4857 s. K. gecici m.11 — 01.01.2018 sonrasi fesihler icin 5 yil.',
      '  Onemli: her alacak kalemi icin ayri zamanasimi hesabi yapilmali.',
      '- Ibra sozlesmesi: fesihten en az 1 ay sonra imzalanmamissa gecersiz (TBK m.420).',
      '  Borcun tam tutarini icermeyen ibra makbuz hükmündedir.',
      '- Istifa goruntulu fesih: odenmemis alacak varsa hakli fesih argumani degerlendirmeli.',
      '- Imzali bordrolar + fazla mesai sutunu bossa → tanık stratejisi gerekir.',
      '- Asil isveren-alt isveren iliskisi varsa muteselsil sorumluluk.',
      '- Belirsiz alacak davasi (HMK m.107) veya kismi dava secimi.',
      '- Ise iade: 30+ isci + 6 ay kidem sarti kontrol.',
      '- Kidem tavani döneme göre uygulanir.',
    ].join('\n'),

    bosanma: [
      'BOSANMA DAVASI OZEL KONTROL NOKTALARI:',
      '- Gorevli mahkeme: Aile Mahkemesi (yoksa Asliye Hukuk).',
      '- Yetkili yer: TMK m.168 — eslerden birinin yerlesim yeri veya son 6 aydir birlikte oturdugu yer.',
      '- Anlasmalı bosanma: TMK m.166/3 — en az 1 yil evlilik suresi.',
      '  Protokol zorunlu. Cocuk varsa velayet, istirak nafakasi, kisisel iliski duzeni.',
      '- Cekismeli bosanma: TMK m.166/1-2 evlilik birligi temelden sarsilma veya ozel bosanma sebepleri (m.161-165).',
      '- Arabuluculuk: bosanma davalarinda zorunlu degil (2024 itibariyle).',
      '  Ancak mal rejimleri ve tazminat icin arabuluculuk onerilebilir.',
      '- Tedbir nafakasi: dava ile birlikte talep edilmeli.',
      '- Velayet, kisisel iliski, istirak nafakasi, yoksulluk nafakasi, maddi-manevi tazminat ayri ayri degerlendir.',
      '- Ozel vekaletname gerekli: "bosanma davasi acmaya" ibaresi.',
    ].join('\n'),

    velayet: [
      'VELAYET DAVASI OZEL KONTROL NOKTALARI:',
      '- Gorevli mahkeme: Aile Mahkemesi.',
      '- Velayet degisikligi: TMK m.183, m.349.',
      '- Cocugun ustun yarari ilkesi: her kararda belirleyici.',
      '- Pedagog / sosyal hizmet uzmani raporu alinmasi zorunlu.',
      '- Kisisel iliski duzeni birlikte degerlendirilmeli.',
    ].join('\n'),

    icra: [
      'ICRA HUKUKU OZEL KONTROL NOKTALARI:',
      '- Itirazin iptali davasi: 2004 s. IIK m.67 — 1 yil hak dusurucu sure.',
      '- Itirazin kaldirilmasi: IIK m.68.',
      '- Menfi tespit davasi: IIK m.72.',
      '- Istirdat davasi: IIK m.72/7.',
      '- Gorevli mahkeme: asıl alacağın niteliğine göre (is, tuketici, ticaret vb.).',
      '- Icra inkar tazminati: %20 — kotu niyetli itirazda.',
    ].join('\n'),

    ceza: [
      'CEZA DAVASI OZEL KONTROL NOKTALARI:',
      '- Suc turu ve karsiligi: 5237 s. TCK ilgili maddeleri.',
      '- Sorusturma asamasi: CMK m.160 vd.',
      '- Kovusturma asamasi: CMK m.175 vd.',
      '- Tutukluluk / adli kontrol: CMK m.100-115.',
      '- Sikayete bagli suclar: CMK m.73 — 6 ay sikayet suresi.',
      '- Uzlastirma: CMK m.253 — bazi suclarda zorunlu.',
      '- HAGB (hükmün açıklanmasının geri bırakılması): CMK m.231.',
      '- Etkin pismanlik: ilgili suc maddesine gore degerlendirmeli.',
    ].join('\n'),

    idare: [
      'IDARI DAVA OZEL KONTROL NOKTALARI:',
      '- Gorevli mahkeme: Idare Mahkemesi (veya Vergi Mahkemesi).',
      '- Dava acma suresi: 2577 s. IYUK m.7 — 60 gun (yazili bildirimden itibaren).',
      '- Zorunlu idari basvuru: bazi islemlerde ust makama basvuru on sart.',
      '- Yurutmenin durdurulmasi: IYUK m.27.',
      '- Iptal davasi vs tam yargi davasi ayrimi.',
      '- Idari islemin 5 unsuru: yetki, sekil, sebep, konu, amac.',
    ].join('\n'),

    kira: [
      'KIRA DAVASI OZEL KONTROL NOKTALARI:',
      '- Gorevli mahkeme: Sulh Hukuk Mahkemesi (TBK m.4).',
      '- Tahliye davalari: TBK m.350-356 (ihtiyac, yeni malik, tadilat vb.).',
      '- Kira tespit davasi: TBK m.344 — yeni dönem baslangicindan en gec 30 gun once ihtar veya dava.',
      '- Kira bedelinin odenmemesi: TBK m.315 — 30 gun (konut) / 10 gun (isyeri) mehil.',
      '- Arabuluculuk zorunlu: 01.09.2023 sonrasi kira uyusmazliklarinda (7445 s. K.).',
      '- Iki hakli ihtar nedeniyle tahliye: TBK m.352/2.',
    ].join('\n'),

    mal_paylasimi: [
      'MAL PAYLASIMI DAVASI OZEL KONTROL NOKTALARI:',
      '- Gorevli mahkeme: Aile Mahkemesi.',
      '- Mal rejimi tasfiyesi: TMK m.202 vd. — yasal mal rejimi: edinilmis mallara katilma.',
      '- 01.01.2002 oncesi: mal ayriligi rejimi.',
      '- Katilma alacagi: TMK m.231.',
      '- Zamanasimi: bosanma kararinin kesinlesmesinden itibaren 10 yil.',
      '- Aile konutu serhine dikkat: TMK m.194.',
    ].join('\n'),
  }

  return guidance[normalized] || ''
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripJsonFences(value: string) {
  const trimmed = value.trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/u, '').replace(/\s*```$/u, '').trim()
  }
  return trimmed
}

export function hasProcedureAiConfig() {
  return hasClaudeCliConfig()
}

// ─── Precheck AI ─────────────────────────────────────────────────────────────

export async function generatePrecheckWithAi(input: ProcedureAiInput): Promise<PrecheckResult> {
  const caseGuidance = getCaseTypeSpecificGuidance(input.caseType)

  const systemPrompt = [
    'Sen Turk hukuku uzmani bir usul ajanisin.',
    'Gorevin, verilen dava bilgilerinden usul on kontrolunu yapmaktir.',
    'Gorevli ve yetkili mahkemeyi, arabuluculuk zorunlulugunu, zamanasimi durumunu,',
    'ozel vekaletname gerekip gerekmedigi ni ve dava sarti eksiklerini tespit et.',
    'Alternatif uyusmazlik cozum yollarini (arabuluculuk, tahkim komisyonu, hakem heyeti) mutlaka degerlendirmelisin.',
    'Yaniti sadece gecerli JSON olarak ver, baska aciklama ekleme.',
    'Turkce yaz. Somut ve dava-ozel tespitler yap.',
    caseGuidance ? `\n\n${caseGuidance}` : '',
  ].join(' ')

  const userPrompt = [
    `Dava Basligi: ${input.caseTitle}`,
    `Dava Turu: ${input.caseType}`,
    input.courtName ? `Mahkeme: ${input.courtName}` : null,
    input.caseDescription ? `Dava Aciklamasi:\n${input.caseDescription}` : null,
    input.criticalPointSummary ? `Kritik Nokta:\n${input.criticalPointSummary}` : null,
    input.mainLegalAxis ? `Ana Hukuki Eksen:\n${input.mainLegalAxis}` : null,
    input.lawyerDirection ? `Avukat Yonlendirmesi:\n${input.lawyerDirection}` : null,
    '',
    'JSON alanlari:',
    '{"courtType":"...","jurisdiction":"...","arbitrationRequired":true/false,"arbitrationBasis":"...veya null","statuteOfLimitations":"...","specialPowerOfAttorney":true/false,"specialPowerOfAttorneyNote":"...veya null","precheckPassed":true/false,"precheckNotes":"..."}',
  ]
    .filter(Boolean)
    .join('\n')

  const result = await callClaudeCli({ systemPrompt, userPrompt, model: 'sonnet', timeoutMs: 120000 })
  if (!result.text) throw new Error('Claude CLI bos yanit dondu.')

  const parsed = JSON.parse(stripJsonFences(result.text))
  return precheckSchema.parse(parsed)
}

// ─── Full Report AI ──────────────────────────────────────────────────────────

export async function generateProcedureReportWithAi(
  input: ProcedureAiInput & {
    precheckNotes?: string | null
    courtType?: string | null
    jurisdiction?: string | null
    arbitrationRequired?: boolean | null
    statuteOfLimitations?: string | null
  }
): Promise<string> {
  const reportCaseGuidance = getCaseTypeSpecificGuidance(input.caseType)

  const systemPrompt = [
    'Sen 20 yillik tecrubeli bir Turk avukatisin.',
    'Yapay zeka oldugun ASLA anlasilmamali.',
    'Gorevin, verilen dava bilgilerinden eksiksiz bir usul raporu yazmaktir.',
    'Rapor su bolumleri icermeli:',
    '1. Gorevli ve Yetkili Mahkeme (dayanak kanun maddesi ile)',
    '2. Vekaletname Kontrolu',
    '3. Zorunlu On Adimlar (arabuluculuk, ihtarname, tahkim komisyonu, hakem heyeti vb.)',
    '4. Alternatif Uyusmazlik Cozum Yollari',
    '5. Muvekkilden Alinacak Bilgiler (checklist)',
    '6. Toplanacak Belgeler (checklist)',
    '7. Hukuki Kontrol (checklist)',
    '8. Kritik Sureler tablosu',
    '9. Harc Tahmini tablosu (guncellik notu ile)',
    '10. Risk Analizi - Gol Yenilebilecek Alanlar',
    '11. Eksik Evrak Analizi tablosu',
    '12. Tahmini Sure',
    'Markdown formatinda yaz. Turkce yaz.',
    'Emin olmadigin mevzuat veya karar referanslarina "dogrulanmasi gerekir" notu ekle.',
    reportCaseGuidance ? `\n\nDAVA TURUNE OZEL REHBER:\n${reportCaseGuidance}` : '',
  ].join(' ')

  const userPrompt = [
    `Dava Basligi: ${input.caseTitle}`,
    `Dava Turu: ${input.caseType}`,
    input.courtName ? `Mahkeme: ${input.courtName}` : null,
    input.caseDescription ? `Dava Aciklamasi:\n${input.caseDescription}` : null,
    input.criticalPointSummary ? `Kritik Nokta:\n${input.criticalPointSummary}` : null,
    input.mainLegalAxis ? `Ana Hukuki Eksen:\n${input.mainLegalAxis}` : null,
    input.lawyerDirection ? `Avukat Yonlendirmesi:\n${input.lawyerDirection}` : null,
    input.briefingSummary ? `Briefing Ozeti:\n${input.briefingSummary}` : null,
    input.precheckNotes ? `On Kontrol Sonucu:\n${input.precheckNotes}` : null,
    input.courtType ? `Gorevli Mahkeme (on kontrol): ${input.courtType}` : null,
    input.jurisdiction ? `Yetkili Yer (on kontrol): ${input.jurisdiction}` : null,
    input.arbitrationRequired != null
      ? `Arabuluculuk Zorunlu: ${input.arbitrationRequired ? 'Evet' : 'Hayir'}`
      : null,
    input.statuteOfLimitations ? `Zamanasimi (on kontrol): ${input.statuteOfLimitations}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')

  const result = await callClaudeCli({ systemPrompt, userPrompt, model: 'sonnet', timeoutMs: 180000 })
  if (!result.text) throw new Error('Claude CLI bos yanit dondu.')

  return result.text
}
