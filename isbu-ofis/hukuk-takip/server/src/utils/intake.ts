type IntakeDocumentInput = {
  fileName: string
  description?: string | null
  createdAt?: string | Date | null
  extractedText?: string | null
  extractionStatus?: 'extracted' | 'empty' | 'unsupported' | 'error' | null
}

type IntakeNoteInput = {
  content: string
  createdAt?: string | Date | null
}

type IntakeGenerationInput = {
  caseType?: string | null
  caseTitle: string
  caseDescription?: string | null
  clientName?: string | null
  courtName?: string | null
  lawyerDirection?: string | null
  clientInterviewNotes?: string | null
  documents: IntakeDocumentInput[]
  notes: IntakeNoteInput[]
}

export type GeneratedIntakeProfile = {
  autoDocumentSummary: string
  autoFactSummary: string
  criticalPointSummary: string
  mainLegalAxis: string
  secondaryRisks: string
  proofRisks: string
  missingInformation: string
  missingDocuments: string
  opponentInitialArguments: string
}

type GeneratedBriefing = {
  summary: string
  mainGoal: string
  secondaryGoal: string
  mainProcedureRisk: string
  mainProofRisk: string
  toneStrategy: string
  markdownContent: string
}

export type GeneratedResearchProfileDraft = {
  researchQuestion: string
  searchKeywords: string
  useYargiMcp: boolean
  yargiQuery: string
  yargiCourtTypes: string
  yargiChamber: string | null
  yargiResultLimit: number
  useMevzuatMcp: boolean
  mevzuatQuery: string
  mevzuatScope: string
  mevzuatLawNumbers: string
  mevzuatResultLimit: number
  useNotebooklm: boolean
  notebooklmQuestion: string
  useVectorDb: boolean
  vectorQuery: string
  vectorTopK: number
}

const CASE_TYPE_LABELS: Record<string, string> = {
  iscilik_alacagi: 'Iscilik Alacagi',
  bosanma: 'Bosanma',
  velayet: 'Velayet',
  mal_paylasimi: 'Mal Paylasimi',
  kira: 'Kira',
  tuketici: 'Tuketici',
  icra: 'Icra',
  ceza: 'Ceza',
  idare: 'Idare',
  diger: 'Diger',
}

const CASE_TYPE_MISSING_DOCUMENTS: Partial<Record<string, string[]>> = {
  bosanma: [
    'Evlilik tarihi ve ayrilik zaman cizelgesi',
    'Varsa cocuklara iliskin temel bilgiler ve mevcut fiili duzen',
    'Varsa nafaka talebini destekleyen gelir-gider verileri',
    'Varsa siddet, aldatma veya hakaret iddiasini destekleyen yazisma / rapor / tutanak',
  ],
  iscilik_alacagi: [
    'SGK hizmet dokumu veya ise giris-cikis kayitlari',
    'Bordro, puantaj veya ucret odeme kayitlari',
    'Banka hesap hareketleri ve maas odemeleri',
  ],
  kira: [
    'Kira sozlesmesi',
    'Kira odeme dekontlari',
    'Ihtarname veya temerrut bildirimi',
  ],
}

function normalizeText(value?: string | null) {
  return (value || '').trim()
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıİ]/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isSystemGeneratedNote(content?: string | null) {
  const normalized = normalizeText(content)
  return normalized.startsWith('[AI Workspace]') || normalized.startsWith('[AI ')
}

function uniqueLines(lines: string[]) {
  return Array.from(new Set(lines.map((line) => line.trim()).filter(Boolean)))
}

function toBulletBlock(lines: string[], emptyLine = '- Henuz veri yok') {
  const unique = uniqueLines(lines)
  if (unique.length === 0) {
    return emptyLine
  }

  return unique.map((line) => `- ${line}`).join('\n')
}

function summarizeDocuments(documents: IntakeDocumentInput[]) {
  const lines = documents.slice(0, 8).map((document) => {
    const note = normalizeText(document.description)
    const extractedText = normalizeText(document.extractedText)
    const fileLabel = document.fileName

    if (extractedText) {
      const excerpt = extractedText.length > 280 ? `${extractedText.slice(0, 277)}...` : extractedText
      return note ? `${fileLabel}: ${note} | belge metni: ${excerpt}` : `${fileLabel}: belge metni: ${excerpt}`
    }

    if (note) {
      return `${fileLabel}: ${note}`
    }

    if (document.extractionStatus === 'unsupported') {
      return `${fileLabel}: yuklenmis belge (icerik bu formatta otomatik okunamadi)`
    }

    return `${fileLabel}: yuklenmis belge`
  })

  return toBulletBlock(lines)
}

function summarizeFacts(input: IntakeGenerationInput) {
  const factLines: string[] = []

  if (normalizeText(input.caseDescription)) {
    factLines.push(`Dava ozeti: ${normalizeText(input.caseDescription)}`)
  }

  if (normalizeText(input.lawyerDirection)) {
    factLines.push(`Avukat yonlendirmesi: ${normalizeText(input.lawyerDirection)}`)
  }

  if (normalizeText(input.clientInterviewNotes)) {
    factLines.push(`Muvekkil gorusme notu: ${normalizeText(input.clientInterviewNotes)}`)
  }

  for (const note of input.notes.filter((item) => !isSystemGeneratedNote(item.content)).slice(0, 5)) {
    const content = normalizeText(note.content)
    if (content) {
      factLines.push(`Dava notu: ${content}`)
    }
  }

  return toBulletBlock(factLines)
}

function detectBosanmaAxis(searchText: string) {
  if (searchText.includes('velayet') || searchText.includes('cocuk') || searchText.includes('cocugun')) {
    return 'Bosanma dosyasinin ana ekseni velayet ve cocugun ustun yarari etrafinda sekilleniyor.'
  }

  if (searchText.includes('nafaka') || searchText.includes('gelir') || searchText.includes('gider')) {
    return 'Bosanma dosyasinda ana eksen nafaka ve ekonomik denge taleplerinin guclu kurulmasi.'
  }

  if (
    searchText.includes('siddet') ||
    searchText.includes('uzaklastirma') ||
    searchText.includes('hakaret') ||
    searchText.includes('tehdit')
  ) {
    return 'Bosanma dosyasinin ana ekseni siddet, guvenlik ve koruyucu tedbir ihtiyaci etrafinda kuruluyor.'
  }

  if (searchText.includes('aldatma') || searchText.includes('sadakat')) {
    return 'Bosanma dosyasinin ana ekseni kusur ve sadakat yukumlulugunun ihlali iddialari etrafinda kuruluyor.'
  }

  return 'Bosanma dosyasinda ana eksen evlilik birliginin temelinden sarsildiginin somut olay ve delillerle kurulmasi.'
}

function detectMainAxis(caseType: string | null | undefined, searchText: string) {
  if (caseType === 'bosanma') {
    return detectBosanmaAxis(searchText)
  }

  if (caseType === 'iscilik_alacagi') {
    return 'Iscilik alacagi dosyasinda ana eksen hizmet suresi, ucret akisi ve fesih kosullarinin ispatlanmasi.'
  }

  if (caseType === 'kira') {
    return 'Kira dosyasinda ana eksen kira iliskisinin sartlari, odeme duzeni ve ihtar surecinin dogru kurulmasi.'
  }

  if (caseType === 'icra') {
    return 'Icra dosyasinda ana eksen takip evrakinin, surelerin ve borc hareketlerinin netlestirilmesi.'
  }

  return 'Davanin ana hukuki ekseni, olay orgusu ile belge seti birlikte degerlendirilerek kurulmalidir.'
}

function buildSecondaryRisks(caseType: string | null | undefined, searchText: string, hasDocuments: boolean) {
  const risks: string[] = []

  if (!hasDocuments) {
    risks.push('Belge seti zayif oldugu icin ilk risk delil tabaninin gec olusmasi.')
  }

  if (caseType === 'bosanma') {
    risks.push('Taraflarin olay anlatimlari arasindaki celiskiler kusur tartismasini zorlastirabilir.')
    if (searchText.includes('velayet') || searchText.includes('cocuk')) {
      risks.push('Velayet ekseninde fiili bakim duzeninin somut belgelerle desteklenmemesi risk yaratir.')
    }
    if (searchText.includes('nafaka')) {
      risks.push('Nafaka taleplerinde gelir-gider verisinin eksik kalmasi miktar tespitini zayiflatir.')
    }
  } else {
    risks.push('Dava acilisinda olay orgusunun yeterince tarihlendirilmemesi sonraki raporlari zayiflatir.')
  }

  return toBulletBlock(risks)
}

function buildProofRisks(documents: IntakeDocumentInput[], searchText: string) {
  const risks: string[] = []

  if (documents.length === 0) {
    risks.push('Henuz yuklenmis belge olmadigi icin ispat omurgasi soyut kalabilir.')
  }

  const hasOfficialDocument = documents.some((document) =>
    /mahkeme|uyap|rapor|teblig|tutanak|sgk|banka/i.test(document.fileName)
  )

  if (!hasOfficialDocument) {
    risks.push('Resmi belge veya kurum kaydi az; sadece beyan ve yazisma ile ilerlemek riskli olabilir.')
  }

  if (searchText.includes('mesaj') || searchText.includes('whatsapp')) {
    risks.push('Mesaj kayitlarinin tarih, taraf ve butunluk kontrolu ayrica yapilmalidir.')
  }

  return toBulletBlock(risks)
}

function buildMissingInformation(caseType: string | null | undefined, searchText: string) {
  const info: string[] = [
    'Olay akisinin net tarih sirasi',
    'Muvekkilin birincil hedefi ve kabul edecegi ikinci yol',
  ]

  if (caseType === 'bosanma') {
    info.push('Varsa cocuklarin yasi, fiili bakim duzeni ve taraflarin talepleri')
    info.push('Taraflarin gelir-gider durumu ve nafaka beklentisi')
    if (searchText.includes('mal')) {
      info.push('Mal rejimi uyusmazligi olup olmadigi ve evlilik icindeki edinimler')
    }
  }

  return toBulletBlock(info)
}

function buildMissingDocuments(caseType: string | null | undefined, documents: IntakeDocumentInput[]) {
  const searchText = normalizeSearchText(
    documents.map((document) => `${document.fileName} ${document.description || ''}`).join(' ')
  )
  const requirements = CASE_TYPE_MISSING_DOCUMENTS[caseType || ''] || []
  const missing = requirements.filter((requirement) => !searchText.includes(normalizeSearchText(requirement)))

  return toBulletBlock(missing, '- Ilk kontrol seviyesinde belirgin eksik belge tespiti yok')
}

function buildOpponentArguments(caseType: string | null | undefined, searchText: string) {
  const argumentsList: string[] = []

  if (caseType === 'bosanma') {
    argumentsList.push('Karsi taraf kusurun agirliginin muvekkilde oldugunu ileri surebilir.')
    argumentsList.push('Olaylarin abartildigi veya tek tarafli aktarildigi savunmasi gelebilir.')
    if (searchText.includes('velayet') || searchText.includes('cocuk')) {
      argumentsList.push('Velayet konusunda cocugun mevcut duzeninin degistirilmemesi gerektigi savunmasi gelebilir.')
    }
    if (searchText.includes('nafaka')) {
      argumentsList.push('Nafaka talebinin olcululuk sinirini astigi veya gelir durumunun farkli oldugu savunulabilir.')
    }
  } else {
    argumentsList.push('Karsi taraf olay orgusunun eksik veya yanli verildigini ileri surebilir.')
    argumentsList.push('Belge setindeki bosluklar uzerinden ispat yetersizligi savunmasi gelebilir.')
  }

  return toBulletBlock(argumentsList)
}

function buildCriticalFocusPoints(caseType: string | null | undefined, searchText: string) {
  const focusPoints: string[] = []

  if (caseType === 'bosanma') {
    if (searchText.includes('kusur')) {
      focusPoints.push('Kusur anlatimi tarih sirasi icinde netlestirilmeli ve her iddia somut olayla eslestirilmelidir.')
    }
    if (searchText.includes('ziynet') || searchText.includes('tak') || searchText.includes('altin')) {
      focusPoints.push('Ziynet esyalarinin kimde kaldigi, ne zaman alindigi ve iade/alacak talebinin delil zemini ayri kurulmalidir.')
    }
    if (searchText.includes('whatsapp') || searchText.includes('mesaj') || searchText.includes('yazisma')) {
      focusPoints.push('WhatsApp ve diger yazisma delilleri taraf, tarih ve butunluk kontrolu yapilarak dosyaya yerlestirilmelidir.')
    }
    if (searchText.includes('aldatma') || searchText.includes('sadakat')) {
      focusPoints.push('Sadakat yukumlulugunun ihlali iddiasi varsa bunun hangi olay ve hangi delille kurulacagi ayri gosterilmelidir.')
    }
    if (
      searchText.includes('siddet') ||
      searchText.includes('hakaret') ||
      searchText.includes('tehdit') ||
      searchText.includes('uzaklastirma')
    ) {
      focusPoints.push('Siddet veya hakaret iddialari varsa koruyucu tedbir ihtiyaci ve resmi kayitlarla desteklenme durumu one alinmalidir.')
    }
    if (searchText.includes('velayet') || searchText.includes('cocuk')) {
      focusPoints.push('Cocuk varsa fiili bakim duzeni ve cocugun ustun yararina iliskin veri ayri delil basligi olarak ele alinmalidir.')
    }
    if (searchText.includes('nafaka')) {
      focusPoints.push('Nafaka ekseninde taraflarin gelir-gider yapisi ve mevcut yasam standardi somutlastirilmalidir.')
    }
  }

  if (focusPoints.length === 0) {
    focusPoints.push('Olay orgusu, muvekkil beyanlari ve belge seti ayni zaman cizelgesinde birlestirilerek ana ihtilaf omurgasi kurulmalidir.')
  }

  return focusPoints.slice(0, 4)
}

function buildCriticalPointSummary(input: IntakeGenerationInput, mainLegalAxis: string, searchText: string) {
  const lines = [mainLegalAxis]
  const focusPoints = buildCriticalFocusPoints(input.caseType, searchText)

  const sourceSignals: string[] = []
  if (normalizeText(input.caseDescription)) {
    sourceSignals.push('dava acilis notu')
  }
  if (normalizeText(input.lawyerDirection)) {
    sourceSignals.push('avukat yonlendirmesi')
  }
  if (normalizeText(input.clientInterviewNotes)) {
    sourceSignals.push('muvekkil gorusme notu')
  }
  if (input.documents.some((document) => normalizeText(document.extractedText))) {
    sourceSignals.push('okunabilen belge metinleri')
  } else if (input.documents.length > 0) {
    sourceSignals.push('yuklenmis belge metadatalari')
  }

  lines.push(
    sourceSignals.length > 0
      ? `Kritik nokta sentezi ${sourceSignals.join(', ')} birlikte degerlendirilerek olusturuldu.`
      : 'Kritik nokta sentezi mevcut dava verileri birlikte degerlendirilerek olusturuldu.'
  )

  lines.push(['Kritik odaklar:', ...focusPoints.map((item) => `- ${item}`)].join('\n'))

  lines.push(
    input.documents.length > 0
      ? `Sistemde ${input.documents.length} belge kaydi mevcut; ispat omurgasi bu set uzerinden kurulabilir.`
      : 'Sistemde henuz belge kaydi olmadigi icin once temel delil seti toplanmalidir.'
  )

  return lines.join('\n\n')
}

function buildKeywordSet(caseType: string | null | undefined, searchText: string) {
  const keywords: string[] = []

  if (caseType === 'bosanma') {
    keywords.push('bosanma')
    keywords.push('evlilik birliginin temelinden sarsilmasi')
  }

  const triggerMap: Array<[string, string]> = [
    ['kusur', 'kusur'],
    ['ziynet', 'ziynet'],
    ['altin', 'ziynet'],
    ['whatsapp', 'whatsapp yazismalari'],
    ['mesaj', 'mesaj kayitlari'],
    ['sadakat', 'sadakat yukumlulugu'],
    ['aldatma', 'aldatma'],
    ['nafaka', 'nafaka'],
    ['velayet', 'velayet'],
    ['cocuk', 'cocuk'],
    ['siddet', 'siddet'],
    ['hakaret', 'hakaret'],
    ['tehdit', 'tehdit'],
    ['mal rejimi', 'mal rejimi'],
    ['tanik', 'tanik'],
  ]

  for (const [needle, keyword] of triggerMap) {
    if (searchText.includes(needle)) {
      keywords.push(keyword)
    }
  }

  return uniqueLines(keywords).slice(0, 8)
}

function buildResearchQuestion(caseType: string | null | undefined, generated: GeneratedIntakeProfile, keywords: string[]) {
  if (caseType === 'bosanma') {
    const focus = keywords.filter((keyword) => keyword !== 'bosanma' && keyword !== 'evlilik birliginin temelinden sarsilmasi')
    const suffix = focus.length > 0 ? ` Ozellikle ${focus.join(', ')} eksenlerinde` : ''
    return `Bu bosanma davasinda davacinin iddialari${suffix} nasil hukuken kurulmalidir, hangi deliller one cikarilmali ve karsi tarafin muhtemel savunmalarina nasil cevap verilmelidir?`
  }

  return `Bu dosyada ${generated.mainLegalAxis.toLocaleLowerCase('tr-TR')} ekseninde hangi hukuki argumanlar, deliller ve usul tercihleri one cikarilmalidir?`
}

function buildMevzuatScope(caseType: string | null | undefined, keywords: string[]) {
  if (caseType === 'bosanma') {
    const scopes = ['TMK 161-166 bosanma sebepleri', 'HMK delil ve ispat rejimi']
    if (keywords.includes('nafaka')) {
      scopes.push('TMK nafaka rejimi')
    }
    if (keywords.includes('velayet') || keywords.includes('cocuk')) {
      scopes.push('velayet ve cocugun ustun yarari')
    }
    if (keywords.includes('ziynet')) {
      scopes.push('ziynet esyasi alacagi ictihadi')
    }
    return uniqueLines(scopes).join(', ')
  }

  return generatedDefaultScopeForCase(caseType)
}

function generatedDefaultScopeForCase(caseType: string | null | undefined) {
  if (caseType === 'iscilik_alacagi') {
    return '4857 sayili Is Kanunu, HMK delil ve ispat rejimi'
  }
  if (caseType === 'icra') {
    return '2004 sayili Icra ve Iflas Kanunu, HMK delil ve ispat rejimi'
  }
  return 'HMK delil ve ispat rejimi'
}

function buildLawNumbers(caseType: string | null | undefined, keywords: string[]) {
  const numbers = ['6100']

  if (caseType === 'bosanma') {
    numbers.unshift('4721')
    if (keywords.includes('siddet') || keywords.includes('tehdit')) {
      numbers.push('6284')
    }
  }

  if (caseType === 'icra') {
    numbers.unshift('2004')
  }

  if (caseType === 'iscilik_alacagi') {
    numbers.unshift('4857')
  }

  return uniqueLines(numbers).join(',')
}

export function generateResearchProfileDraft(input: IntakeGenerationInput, generated: GeneratedIntakeProfile): GeneratedResearchProfileDraft {
  const searchText = normalizeSearchText(
    [
      input.caseTitle,
      input.caseDescription || '',
      input.lawyerDirection || '',
      input.clientInterviewNotes || '',
      generated.criticalPointSummary,
      generated.mainLegalAxis,
      ...input.documents.map(
        (document) => `${document.fileName} ${document.description || ''} ${document.extractedText || ''}`
      ),
      ...input.notes.filter((note) => !isSystemGeneratedNote(note.content)).map((note) => note.content),
    ].join(' ')
  )

  const keywords = buildKeywordSet(input.caseType, searchText)
  const researchQuestion = buildResearchQuestion(input.caseType, generated, keywords)
  const searchKeywords = keywords.join(', ')
  const yargiQuery = keywords.slice(0, 5).join(' ') || normalizeText(input.caseTitle)
  const mevzuatScope = buildMevzuatScope(input.caseType, keywords)
  const mevzuatLawNumbers = buildLawNumbers(input.caseType, keywords)
  const mevzuatQuery = searchKeywords || generated.mainLegalAxis

  return {
    researchQuestion,
    searchKeywords,
    useYargiMcp: true,
    yargiQuery,
    yargiCourtTypes: 'YARGITAYKARARI,ISTINAFHUKUK',
    yargiChamber: null,
    yargiResultLimit: 5,
    useMevzuatMcp: true,
    mevzuatQuery,
    mevzuatScope,
    mevzuatLawNumbers,
    mevzuatResultLimit: 5,
    useNotebooklm: false,
    notebooklmQuestion: researchQuestion,
    useVectorDb: false,
    vectorQuery: researchQuestion,
    vectorTopK: 5,
  }
}

export function generateIntakeDraft(input: IntakeGenerationInput): GeneratedIntakeProfile {
  const searchText = normalizeSearchText(
    [
      input.caseTitle,
      input.caseDescription || '',
      input.lawyerDirection || '',
      input.clientInterviewNotes || '',
      ...input.documents.map(
        (document) => `${document.fileName} ${document.description || ''} ${document.extractedText || ''}`
      ),
      ...input.notes.filter((note) => !isSystemGeneratedNote(note.content)).map((note) => note.content),
    ].join(' ')
  )

  const mainLegalAxis = detectMainAxis(input.caseType, searchText)
  const documentSummary = summarizeDocuments(input.documents)
  const factSummary = summarizeFacts(input)
  const criticalPointSummary = buildCriticalPointSummary(input, mainLegalAxis, searchText)

  return {
    autoDocumentSummary: documentSummary,
    autoFactSummary: factSummary,
    criticalPointSummary,
    mainLegalAxis,
    secondaryRisks: buildSecondaryRisks(input.caseType, searchText, input.documents.length > 0),
    proofRisks: buildProofRisks(input.documents, searchText),
    missingInformation: buildMissingInformation(input.caseType, searchText),
    missingDocuments: buildMissingDocuments(input.caseType, input.documents),
    opponentInitialArguments: buildOpponentArguments(input.caseType, searchText),
  }
}

function detectToneStrategy(lawyerDirection?: string | null, fallback?: string | null) {
  const searchText = normalizeSearchText(`${lawyerDirection || ''} ${fallback || ''}`)

  if (searchText.includes('sert') || searchText.includes('agresif') || searchText.includes('guclu')) {
    return 'Net, iddiali ve savunmalari onceden goren bir ton'
  }

  if (searchText.includes('uzlas') || searchText.includes('anlas') || searchText.includes('dengeli')) {
    return 'Olculu, profesyonel ve uzlasi kapisini kapatmayan bir ton'
  }

  return 'Profesyonel, net ve delil omurgasini one cikaran bir ton'
}

function deriveMainGoal(caseType?: string | null) {
  if (caseType === 'bosanma') {
    return 'Bosanma talebini hukuki ve olgusal omurga ile guclu sekilde kurmak'
  }

  if (caseType === 'iscilik_alacagi') {
    return 'Iscilik alacaklarini hizmet suresi ve odeme delilleriyle guclu sekilde talep etmek'
  }

  return 'Davanin ana talebini usul ve esas yonunden tutarli sekilde kurmak'
}

function deriveSecondaryGoal(caseType?: string | null) {
  if (caseType === 'bosanma') {
    return 'Velayet, nafaka veya kusur eksenindeki ikincil riskleri kontrollu sekilde yonetmek'
  }

  return 'Eksik delil ve usul risklerini erkenden kapatarak ana talebi desteklemek'
}

function getCaseTypeLabel(caseType?: string | null) {
  return CASE_TYPE_LABELS[caseType || ''] || (caseType || 'Diger')
}

function sanitizeBlock(value?: string | null, fallback = '-') {
  const normalized = normalizeText(value)
  return normalized || fallback
}

export function buildBriefingDraft(input: {
  caseTitle: string
  caseType?: string | null
  clientName?: string | null
  courtName?: string | null
  briefingPath?: string | null
  lawyerDirection?: string | null
  criticalPointSummary?: string | null
  mainLegalAxis?: string | null
  secondaryRisks?: string | null
  proofRisks?: string | null
  missingInformation?: string | null
  missingDocuments?: string | null
  opponentInitialArguments?: string | null
  requestedToneStrategy?: string | null
}) : GeneratedBriefing {
  const toneStrategy =
    sanitizeBlock(input.requestedToneStrategy, '') ||
    detectToneStrategy(input.lawyerDirection, input.criticalPointSummary)

  const summary = sanitizeBlock(input.criticalPointSummary, 'Kritik nokta henuz uretilmedi')
  const mainGoal = deriveMainGoal(input.caseType)
  const secondaryGoal = deriveSecondaryGoal(input.caseType)
  const mainProcedureRisk = sanitizeBlock(input.missingInformation, 'Temel usul riski henuz tespit edilmedi')
  const mainProofRisk = sanitizeBlock(input.proofRisks, 'Belirgin bir ispat riski kaydedilmedi')

  const markdownContent = `# Briefing: ${input.caseTitle}

**Dava Turu:** ${getCaseTypeLabel(input.caseType)}
**Muvekkil:** ${sanitizeBlock(input.clientName)}
**Mahkeme:** ${sanitizeBlock(input.courtName)}

## 1. Hukuki Kritik Nokta
${sanitizeBlock(input.criticalPointSummary)}

## 2. Ana Hukuki Eksen
${sanitizeBlock(input.mainLegalAxis)}

## 3. Ana Hedef
${mainGoal}

## 4. Ikincil Hedef
${secondaryGoal}

## 5. Beklenen Karsi Taraf Cizgisi
${sanitizeBlock(input.opponentInitialArguments)}

## 6. En Buyuk Usul Riski
${mainProcedureRisk}

## 7. En Buyuk Ispat Riski
${mainProofRisk}

## 8. Eksik Bilgi
${sanitizeBlock(input.missingInformation)}

## 9. Eksik Belge
${sanitizeBlock(input.missingDocuments)}

## 10. Ton ve Strateji
${toneStrategy}

## 11. Avukat Yonlendirmesi
${sanitizeBlock(input.lawyerDirection)}
`

  return {
    summary,
    mainGoal,
    secondaryGoal,
    mainProcedureRisk,
    mainProofRisk,
    toneStrategy,
    markdownContent,
  }
}
