const DEFAULT_ACTIVE_CASES_ROOT = "G:\\Drive'ım\\Hukuk Bürosu\\Aktif Davalar"
const ACTIVE_CASES_ROOT =
  process.env.AI_ACTIVE_CASES_ROOT || DEFAULT_ACTIVE_CASES_ROOT

function normalizePathSegment(value: string) {
  return value.replace(/[\\/]+/g, '\\').replace(/\\$/, '')
}

function isInsideActiveCasesRoot(value: string) {
  const normalizedRoot = normalizePathSegment(ACTIVE_CASES_ROOT).toLowerCase()
  const normalizedValue = normalizePathSegment(value).toLowerCase()
  return (
    normalizedValue === normalizedRoot || normalizedValue.startsWith(`${normalizedRoot}\\`)
  )
}

function normalizeOptionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

type AutomationPayload = {
  automationCaseCode?: string
  automationStatus?: string
  driveFolderPath?: string
  briefingPath?: string
  procedurePath?: string
  researchPath?: string
  defenseSimulationPath?: string
  revisionPath?: string
  pleadingMdPath?: string
  pleadingUdfPath?: string
}

export function withAutomationDefaults<T extends AutomationPayload>(payload: T): T {
  const automationCaseCode = normalizeOptionalString(payload.automationCaseCode)
  if (!automationCaseCode) {
    return payload
  }

  const driveFolderPath =
    (() => {
      const existingPath = normalizeOptionalString(payload.driveFolderPath)
      if (existingPath && isInsideActiveCasesRoot(existingPath)) {
        return normalizePathSegment(existingPath)
      }

      return ''
    })() ||
    normalizePathSegment(`${ACTIVE_CASES_ROOT}\\${automationCaseCode}`)

  const nextStatus =
    normalizeOptionalString(payload.automationStatus) ||
    (driveFolderPath ? 'folder_ready' : 'not_started')

  return {
    ...payload,
    automationCaseCode,
    automationStatus: nextStatus,
    driveFolderPath,
    briefingPath:
      normalizeOptionalString(payload.briefingPath) || `${driveFolderPath}\\00-Briefing.md`,
    procedurePath:
      normalizeOptionalString(payload.procedurePath) || `${driveFolderPath}\\01-Usul\\usul-raporu.md`,
    researchPath:
      normalizeOptionalString(payload.researchPath) ||
      `${driveFolderPath}\\02-Arastirma\\arastirma-raporu.md`,
    defenseSimulationPath:
      normalizeOptionalString(payload.defenseSimulationPath) ||
      `${driveFolderPath}\\02-Arastirma\\savunma-simulasyonu.md`,
    revisionPath:
      normalizeOptionalString(payload.revisionPath) ||
      `${driveFolderPath}\\03-Sentez-ve-Dilekce\\revizyon-raporu-v1.md`,
    pleadingMdPath:
      normalizeOptionalString(payload.pleadingMdPath) ||
      `${driveFolderPath}\\03-Sentez-ve-Dilekce\\dava-dilekcesi-v1.md`,
    pleadingUdfPath:
      normalizeOptionalString(payload.pleadingUdfPath) ||
      `${driveFolderPath}\\03-Sentez-ve-Dilekce\\dava-dilekcesi-v1.udf`,
  }
}
