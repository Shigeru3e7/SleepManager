"use client"

import type { SleepRecord, UserSettings, WeeklyQuestionnaire, NapRecord } from "./types"
import { STORAGE_KEYS, type StorageKey } from "./storage-keys"

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

const memoryStore = new Map<string, string>()
const memoryStorage: StorageLike = {
  getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key)! : null),
  setItem: (key, value) => {
    memoryStore.set(key, value)
  },
  removeItem: (key) => {
    memoryStore.delete(key)
  },
}

let cachedStorage: StorageLike | null = null
let storageChecked = false
let warnedAboutMemoryFallback = false
let persistenceRequested = false

const DEFAULT_USER_SETTINGS: UserSettings = {
  age: 30,
  cycleDuration: 90,
  fallAsleepTime: 15,
  idealSleepHours: 8,
  notificationsEnabled: false,
  bedtimeReminderMinutes: 30,
  timeFormat: "12h",
  themePreference: "light",
}

function getStorage(): StorageLike | null {
  if (cachedStorage) {
    return cachedStorage
  }

  if (typeof window === "undefined") {
    return null
  }

  if (storageChecked && !cachedStorage) {
    return null
  }

  storageChecked = true

  try {
    const testKey = "__sleep_manager_test__"
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    cachedStorage = window.localStorage
    return cachedStorage
  } catch (error) {
    if (!warnedAboutMemoryFallback) {
      console.warn(
        "[storage] localStorage unavailable, falling back to in-memory store. Data will not persist across sessions.",
        error,
      )
      warnedAboutMemoryFallback = true
    }
    cachedStorage = memoryStorage
    return cachedStorage
  }
}

function safeGetItem(key: StorageKey): string | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    return storage.getItem(key)
  } catch (error) {
    console.warn(`[storage] Failed to read key "${key}"`, error)
    return null
  }
}

function safeSetItem(key: StorageKey, value: string): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(key, value)
  } catch (error) {
    console.error(`[storage] Failed to write key "${key}"`, error)
  }
}

function safeRemoveItem(key: StorageKey): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.removeItem(key)
  } catch (error) {
    console.warn(`[storage] Failed to remove key "${key}"`, error)
  }
}

function parseJson<T>(key: StorageKey, rawValue: string | null, fallback: T): T {
  if (!rawValue) return fallback

  try {
    return JSON.parse(rawValue) as T
  } catch (error) {
    console.warn(`[storage] Failed to parse key "${key}"`, error)
    return fallback
  }
}

function sanitizeNumber(value: number, fallback: number, bounds?: { min?: number; max?: number }): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  let result = value
  if (bounds?.min !== undefined) {
    result = Math.max(result, bounds.min)
  }
  if (bounds?.max !== undefined) {
    result = Math.min(result, bounds.max)
  }
  return result
}

function sanitizeUserSettings(settings: UserSettings): UserSettings {
  return {
    age: sanitizeNumber(settings.age, DEFAULT_USER_SETTINGS.age, { min: 1, max: 120 }),
    cycleDuration: sanitizeNumber(settings.cycleDuration, DEFAULT_USER_SETTINGS.cycleDuration, { min: 60, max: 120 }),
    fallAsleepTime: sanitizeNumber(settings.fallAsleepTime, DEFAULT_USER_SETTINGS.fallAsleepTime, { min: 0, max: 120 }),
    idealSleepHours: sanitizeNumber(settings.idealSleepHours, DEFAULT_USER_SETTINGS.idealSleepHours, { min: 4, max: 12 }),
    notificationsEnabled: Boolean(settings.notificationsEnabled),
    bedtimeReminderMinutes: sanitizeNumber(
      settings.bedtimeReminderMinutes,
      DEFAULT_USER_SETTINGS.bedtimeReminderMinutes,
      { min: 5, max: 180 },
    ),
    timeFormat: settings.timeFormat === "24h" ? "24h" : "12h",
    themePreference: settings.themePreference === "dark" ? "dark" : "light",
  }
}

function withDefaults(settings: Partial<UserSettings>): UserSettings {
  return sanitizeUserSettings({
    ...DEFAULT_USER_SETTINGS,
    ...settings,
  } as UserSettings)
}

// Sleep Records
export function saveSleepRecord(record: SleepRecord): void {
  const records = getSleepRecords()
  const existingIndex = records.findIndex((r) => r.id === record.id)

  if (existingIndex >= 0) {
    records[existingIndex] = record
  } else {
    records.push(record)
  }

  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  safeSetItem(STORAGE_KEYS.SLEEP_RECORDS, JSON.stringify(records))
}

export function getSleepRecords(): SleepRecord[] {
  const data = safeGetItem(STORAGE_KEYS.SLEEP_RECORDS)
  return parseJson<SleepRecord[]>(STORAGE_KEYS.SLEEP_RECORDS, data, [])
}

export function getSleepRecordsInRange(startDate: Date, endDate: Date): SleepRecord[] {
  const records = getSleepRecords()
  return records.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= startDate && recordDate <= endDate
  })
}

export function getRecentSleepRecords(days = 14): SleepRecord[] {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return getSleepRecordsInRange(startDate, endDate)
}

// User Settings
export function saveUserSettings(settings: UserSettings): void {
  const sanitized = withDefaults(settings)
  safeSetItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(sanitized))
}

export function getUserSettings(): UserSettings | null {
  const data = safeGetItem(STORAGE_KEYS.USER_SETTINGS)
  const parsed = parseJson<Partial<UserSettings> | null>(STORAGE_KEYS.USER_SETTINGS, data, null)
  if (!parsed) return null
  return withDefaults(parsed)
}

// Weekly Questionnaires
export function saveQuestionnaire(questionnaire: WeeklyQuestionnaire): void {
  const questionnaires = getQuestionnaires()
  const existingIndex = questionnaires.findIndex((q) => q.id === questionnaire.id)

  if (existingIndex >= 0) {
    questionnaires[existingIndex] = questionnaire
  } else {
    questionnaires.push(questionnaire)
  }

  safeSetItem(STORAGE_KEYS.QUESTIONNAIRES, JSON.stringify(questionnaires))
}

export function getQuestionnaires(): WeeklyQuestionnaire[] {
  const data = safeGetItem(STORAGE_KEYS.QUESTIONNAIRES)
  return parseJson<WeeklyQuestionnaire[]>(STORAGE_KEYS.QUESTIONNAIRES, data, [])
}

export function shouldShowQuestionnairePrompt(): boolean {
  if (typeof window === "undefined") return false
  if (!hasLoggedSleep()) return false

  const appStartDate = getAppStartDate()
  if (!appStartDate) {
    setAppStartDate()
    return false
  }

  const startDate = new Date(appStartDate)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSince < 7) return false

  const lastPrompt = safeGetItem(STORAGE_KEYS.LAST_QUESTIONNAIRE_PROMPT)
  if (!lastPrompt) return true

  const lastDate = new Date(lastPrompt)
  const daysSinceLastPrompt = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  return daysSinceLastPrompt >= 7
}

export function setQuestionnairePromptShown(): void {
  safeSetItem(STORAGE_KEYS.LAST_QUESTIONNAIRE_PROMPT, new Date().toISOString())
}

// Onboarding
export function setOnboardingComplete(complete: boolean): void {
  safeSetItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete.toString())
}

export function isOnboardingComplete(): boolean {
  return safeGetItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === "true"
}

// Nap Records
export function saveNapRecord(nap: NapRecord): void {
  const naps = getNapRecords()
  const existingIndex = naps.findIndex((n) => n.id === nap.id)

  if (existingIndex >= 0) {
    naps[existingIndex] = nap
  } else {
    naps.push(nap)
  }

  naps.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  safeSetItem(STORAGE_KEYS.NAP_RECORDS, JSON.stringify(naps))
}

export function getNapRecords(): NapRecord[] {
  const data = safeGetItem(STORAGE_KEYS.NAP_RECORDS)
  return parseJson<NapRecord[]>(STORAGE_KEYS.NAP_RECORDS, data, [])
}

export function getRecentNapRecords(days = 14): NapRecord[] {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const naps = getNapRecords()
  return naps.filter((nap) => {
    const napDate = new Date(nap.startTime)
    return napDate >= startDate && napDate <= endDate
  })
}

// Track first sleep log
export function setFirstSleepLogDate(date: string): void {
  safeSetItem(STORAGE_KEYS.FIRST_SLEEP_LOG_DATE, date)
}

export function getFirstSleepLogDate(): string | null {
  return safeGetItem(STORAGE_KEYS.FIRST_SLEEP_LOG_DATE)
}

// Track app start date for weekly questionnaire
export function setAppStartDate(): void {
  if (typeof window === "undefined") return
  if (safeGetItem(STORAGE_KEYS.APP_START_DATE)) {
    return
  }

  safeSetItem(STORAGE_KEYS.APP_START_DATE, new Date().toISOString())
}

export function getAppStartDate(): string | null {
  return safeGetItem(STORAGE_KEYS.APP_START_DATE)
}

// Check if user has logged any sleep
export function hasLoggedSleep(): boolean {
  const records = getSleepRecords()
  return records.length > 0
}

// Calculate total debt over last 14 days
export function calculateTotalDebt(): number {
  const records = getRecentSleepRecords(14)
  if (records.length === 0) {
    return 0
  }

  const sleepDebt = records.reduce((total, record) => {
    if (record.totalSleepMinutes > 0) {
      return total + (record.debtMinutes || 0)
    }
    return total
  }, 0)

  const recentNaps = getRecentNapRecords(14)
  const napRecovery = recentNaps.reduce((total, nap) => {
    return total + (nap.debtReduction || 0)
  }, 0)

  return Math.max(0, sleepDebt - napRecovery)
}

// Clear all data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => safeRemoveItem(key))
}

// Helper to check if it's morning (6 AM - 12 PM)
export function isMorningTime(): boolean {
  const now = new Date()
  const hour = now.getHours()
  return hour >= 6 && hour < 12
}

export async function ensurePersistentStorage(): Promise<void> {
  if (typeof window === "undefined" || typeof navigator === "undefined" || persistenceRequested) {
    return
  }

  persistenceRequested = true

  if (!navigator.storage?.persist) {
    return
  }

  try {
    const alreadyPersisted = await navigator.storage.persisted()
    if (!alreadyPersisted) {
      await navigator.storage.persist()
    }
  } catch (error) {
    console.warn("[storage] Unable to request persistent storage", error)
  }
}
