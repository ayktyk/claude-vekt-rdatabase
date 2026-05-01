/**
 * 5 Ajanli Stratejik Hukuk Analiz Orchestrator'u
 *
 * Arastirma pipeline'i tamamlandiktan sonra:
 * 1. Arastirma paketini 4 perspektif ajana PARALEL gonderir
 * 2. 4 raporu toplar ve format kontrolu yapar
 * 3. Sentez ajanina iletir
 * 4. Nihai strateji raporunu uretir
 *
 * Varsayilan olarak KAPALI - "stratejik analiz" komutuyla tetiklenir.
 */

import Anthropic from '@anthropic-ai/sdk';
import { DAVACI_AVUKAT_PROMPT } from '../agents/prompts/davaci-avukat.prompt';
import { DAVALI_AVUKAT_PROMPT } from '../agents/prompts/davali-avukat.prompt';
import { BILIRKISI_PROMPT } from '../agents/prompts/bilirkisi.prompt';
import { HAKIM_PROMPT } from '../agents/prompts/hakim.prompt';
import { SENTEZ_STRATEJI_PROMPT } from '../agents/prompts/sentez-strateji.prompt';
import type { ResearchPackage, AgentRapor, FiveAgentResult } from '../types/dosya-paketi.types';

const anthropicClient = new Anthropic();

// ============================================================
// LLM Client - Mevcut sistemdeki LLM cagri fonksiyonunu kullan
// ============================================================
// NOT: Bu fonksiyonu kendi sisteminize gore degistirin.
// Ornek: Anthropic SDK, OpenAI SDK, veya mevcut callLLM wrapper'iniz.

interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * LLM cagri fonksiyonu.
 * Mevcut sisteminizdeki LLM client ile degistirin.
 * Su an placeholder olarak tanimli.
 */
async function callLLM(prompt: string, options: LLMOptions = {}): Promise<string> {
  try {
    const response = await anthropicClient.messages.create({
      model: options.model || 'claude-opus-4-20250514',
      max_tokens: options.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock ? textBlock.text : '';
  } catch (error) {
    console.error('LLM API hatasi:', error);
    throw new Error(`LLM cagirisi basarisiz: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
}

// ============================================================
// Hooks - Format Kontrolu ve Validasyon
// ============================================================

/** PreToolUse: Arastirma paketi validasyonu */
function validateResearchPackage(pkg: ResearchPackage): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!pkg.id) errors.push('Paket ID eksik');
  if (!pkg.dava) errors.push('Dava bilgileri eksik');
  if (!pkg.dava?.kritikNokta) errors.push('Kritik nokta belirtilmemis');
  if (!pkg.dava?.ozet) errors.push('Dava ozeti eksik');
  if (!pkg.olusturulmaTarihi) errors.push('Olusturulma tarihi eksik');

  // En az bir arastirma kaynagi olmali
  const hasSource =
    pkg.usulRaporu ||
    pkg.arastirmaRaporu ||
    (pkg.yargiKararlari && pkg.yargiKararlari.length > 0) ||
    (pkg.mevzuatMaddeleri && pkg.mevzuatMaddeleri.length > 0) ||
    (pkg.vektorSonuclari && pkg.vektorSonuclari.length > 0);

  if (!hasSource) {
    errors.push('En az bir arastirma kaynagi (usul raporu, yargi karari, mevzuat, vektor sonucu) gerekli');
  }

  return { valid: errors.length === 0, errors };
}

/** PostToolUse: Ajan ciktisi format kontrolu */
function validateAgentOutput(output: string, agentName: string): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!output || output.trim().length === 0) {
    warnings.push(`${agentName}: Bos cikti`);
    return { valid: false, warnings };
  }

  if (output.length < 200) {
    warnings.push(`${agentName}: Cikti cok kisa (${output.length} karakter) - yetersiz analiz olabilir`);
  }

  return { valid: true, warnings };
}

/** TaskCompleted: Ajan tamamlandiginda log */
function logAgentCompletion(agentName: string, startTime: number, success: boolean, error?: string): void {
  const duration = Date.now() - startTime;
  const status = success ? 'TAMAMLANDI' : 'HATA';
  console.log(`  [${status}] ${agentName} - ${duration}ms${error ? ` - Hata: ${error}` : ''}`);
}

// ============================================================
// Ana Orchestrator
// ============================================================

/**
 * 5 Ajanli Stratejik Analizi calistirir.
 *
 * @param researchPackage - Arastirma pipeline'indan gelen paket
 * @returns Tum ajan raporlarini ve sentez raporunu iceren sonuc
 */
export async function runFiveAgentAnalysis(researchPackage: ResearchPackage): Promise<FiveAgentResult> {
  const totalStart = Date.now();
  console.log('='.repeat(60));
  console.log('  5 AJANLI STRATEJIK ANALIZ BASLIYOR');
  console.log('='.repeat(60));
  console.log(`  Dava: ${researchPackage.dava.muvekkil} - ${researchPackage.dava.davaTuru}`);
  console.log(`  Kritik Nokta: ${researchPackage.dava.kritikNokta}`);
  console.log('');

  // HOOK: PreToolUse - Paket validasyonu
  const validation = validateResearchPackage(researchPackage);
  if (!validation.valid) {
    console.error('  VALIDASYON HATASI:');
    validation.errors.forEach((e) => console.error(`    - ${e}`));
    throw new Error(`Arastirma paketi gecersiz: ${validation.errors.join(', ')}`);
  }
  console.log('  [OK] Arastirma paketi validasyonu gecti');

  const packageText = JSON.stringify(researchPackage, null, 2);
  const llmOptions: LLMOptions = { model: 'claude-sonnet-4-20250514', maxTokens: 4096 };

  // ADIM 1: 4 perspektif ajani PARALEL calistir
  console.log('');
  console.log('  ADIM 1/2: 4 perspektif ajani paralel calisiyor...');

  const agentResults = await Promise.allSettled([
    runSingleAgent('Davaci Avukat', 'davaci', DAVACI_AVUKAT_PROMPT, packageText, llmOptions),
    runSingleAgent('Davali Avukat', 'davali', DAVALI_AVUKAT_PROMPT, packageText, llmOptions),
    runSingleAgent('Bilirkisi', 'bilirkisi', BILIRKISI_PROMPT, packageText, llmOptions),
    runSingleAgent('Hakim', 'hakim', HAKIM_PROMPT, packageText, llmOptions),
  ]);

  // Sonuclari topla
  const [davaciResult, davaliResult, bilirkisiResult, hakimResult] = agentResults;

  const davaciRapor = extractAgentResult(davaciResult, 'Davaci Avukat', 'davaci');
  const davaliRapor = extractAgentResult(davaliResult, 'Davali Avukat', 'davali');
  const bilirkisiRapor = extractAgentResult(bilirkisiResult, 'Bilirkisi', 'bilirkisi');
  const hakimRapor = extractAgentResult(hakimResult, 'Hakim', 'hakim');

  // Basarili ajan sayisini kontrol et
  const basariliAjanSayisi = [davaciRapor, davaliRapor, bilirkisiRapor, hakimRapor].filter((r) => r.basarili).length;

  if (basariliAjanSayisi < 2) {
    throw new Error(`Yetersiz ajan ciktisi: ${basariliAjanSayisi}/4 basarili. Sentez yapilamaz.`);
  }

  if (basariliAjanSayisi < 4) {
    console.warn(`  [UYARI] ${4 - basariliAjanSayisi} ajan basarisiz oldu, sentez eksik verilerle yapilacak.`);
  }

  // HOOK: BeforeSentez - 4 raporun format kontrolu
  console.log('');
  console.log('  Format kontrolu yapiliyor...');
  [davaciRapor, davaliRapor, bilirkisiRapor, hakimRapor].forEach((rapor) => {
    if (rapor.basarili) {
      const check = validateAgentOutput(rapor.icerik, rapor.ajanAdi);
      check.warnings.forEach((w) => console.warn(`  [UYARI] ${w}`));
    }
  });

  // ADIM 2: Sentez Ajani
  console.log('');
  console.log('  ADIM 2/2: Sentez Ajani calisiyor...');

  const sentezPrompt = SENTEZ_STRATEJI_PROMPT
    .replace('{DAVACI_RAPOR}', davaciRapor.basarili ? davaciRapor.icerik : '[Davaci Avukat raporu alinamadi]')
    .replace('{DAVALI_RAPOR}', davaliRapor.basarili ? davaliRapor.icerik : '[Davali Avukat raporu alinamadi]')
    .replace('{BILIRKISI_RAPOR}', bilirkisiRapor.basarili ? bilirkisiRapor.icerik : '[Bilirkisi raporu alinamadi]')
    .replace('{HAKIM_RAPOR}', hakimRapor.basarili ? hakimRapor.icerik : '[Hakim raporu alinamadi]');

  let sentezRapor: string;
  const sentezStart = Date.now();

  try {
    sentezRapor = await callLLM(sentezPrompt, { ...llmOptions, maxTokens: 8192 });
    logAgentCompletion('Sentez & Strateji', sentezStart, true);
  } catch (error) {
    logAgentCompletion('Sentez & Strateji', sentezStart, false, String(error));
    sentezRapor = `[SENTEZ HATASI] 4 perspektif raporu mevcut ancak sentez yapilamadi: ${error}`;
  }

  // Sonuc paketi
  const totalDuration = Date.now() - totalStart;

  const result: FiveAgentResult = {
    timestamp: new Date().toISOString(),
    researchPackageId: researchPackage.id,
    davaciRapor,
    davaliRapor,
    bilirkisiRapor,
    hakimRapor,
    sentezRapor,
    basarili: basariliAjanSayisi >= 2,
    toplamSure: totalDuration,
  };

  console.log('');
  console.log('='.repeat(60));
  console.log('  5 AJANLI STRATEJIK ANALIZ TAMAMLANDI');
  console.log(`  Basarili Ajan: ${basariliAjanSayisi}/4`);
  console.log(`  Toplam Sure: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log('='.repeat(60));

  return result;
}

// ============================================================
// Yardimci Fonksiyonlar
// ============================================================

/** Tek bir perspektif ajanini calistirir */
async function runSingleAgent(
  name: string,
  perspektif: AgentRapor['perspektif'],
  promptTemplate: string,
  packageText: string,
  options: LLMOptions,
): Promise<AgentRapor> {
  const startTime = Date.now();

  try {
    const prompt = promptTemplate.replace('{RESEARCH_PACKAGE}', packageText);
    const response = await callLLM(prompt, options);

    logAgentCompletion(name, startTime, true);

    return {
      ajanAdi: name,
      perspektif,
      icerik: response,
      tamamlanmaTarihi: new Date().toISOString(),
      basarili: true,
    };
  } catch (error) {
    logAgentCompletion(name, startTime, false, String(error));

    return {
      ajanAdi: name,
      perspektif,
      icerik: '',
      tamamlanmaTarihi: new Date().toISOString(),
      basarili: false,
      hata: String(error),
    };
  }
}

/** Promise.allSettled sonucundan AgentRapor cikarir */
function extractAgentResult(
  result: PromiseSettledResult<AgentRapor>,
  name: string,
  perspektif: AgentRapor['perspektif'],
): AgentRapor {
  if (result.status === 'fulfilled') {
    return result.value;
  }

  return {
    ajanAdi: name,
    perspektif,
    icerik: '',
    tamamlanmaTarihi: new Date().toISOString(),
    basarili: false,
    hata: String(result.reason),
  };
}

// ============================================================
// Rapor Formatlama (MD ciktisi)
// ============================================================

/** Tum sonuclari okunaklı MD formatina cevirir */
export function formatResultAsMarkdown(result: FiveAgentResult): string {
  const lines: string[] = [];

  lines.push('# 5 Ajanli Stratejik Analiz Raporu');
  lines.push('');
  lines.push(`**Tarih:** ${result.timestamp}`);
  lines.push(`**Paket ID:** ${result.researchPackageId}`);
  lines.push(`**Basarili Ajan:** ${[result.davaciRapor, result.davaliRapor, result.bilirkisiRapor, result.hakimRapor].filter((r) => r.basarili).length}/4`);
  if (result.toplamSure) {
    lines.push(`**Toplam Sure:** ${(result.toplamSure / 1000).toFixed(1)} saniye`);
  }
  lines.push('');
  lines.push('> UYARI: Bu rapor yapay zeka tarafindan uretilmistir. Nihai karar avukata aittir.');
  lines.push('');

  // Perspektif raporlari
  const raporlar = [
    { baslik: 'Davaci Avukat Perspektifi', rapor: result.davaciRapor },
    { baslik: 'Davali Avukat Perspektifi', rapor: result.davaliRapor },
    { baslik: 'Bilirkisi Perspektifi', rapor: result.bilirkisiRapor },
    { baslik: 'Hakim Perspektifi', rapor: result.hakimRapor },
  ];

  for (const { baslik, rapor } of raporlar) {
    lines.push(`## ${baslik}`);
    lines.push('');
    if (rapor.basarili) {
      lines.push(rapor.icerik);
    } else {
      lines.push(`> [HATA] Bu perspektif raporu alinamadi: ${rapor.hata || 'Bilinmeyen hata'}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Sentez raporu
  lines.push('## SENTEZ VE STRATEJI RAPORU');
  lines.push('');
  lines.push(result.sentezRapor);
  lines.push('');

  return lines.join('\n');
}
