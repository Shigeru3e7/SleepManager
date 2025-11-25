"use client"

import type { SleepRecord, UserSettings, WeeklyQuestionnaire, NapRecord } from "./types"

const STORAGE_KEYS = {
  SLEEP_RECORDS: "sleepRecords",
  USER_SETTINGS: "userSettings",
  QUESTIONNAIRES: "questionnaires",
  ONBOARDING_COMPLETE: "onboardingComplete",
  LAST_QUESTIONNAIRE_PROMPT: "lastQuestionnairePrompt",
  NAP_RECORDS: "napRecords",
  FIRST_SLEEP_LOG_DATE: "firstSleepLogDate",
  APP_START_DATE: "appStartDate",
} as const

// Sleep Records
export function saveSleepRecord(record: SleepRecord): void {
  const records = getSleepRecords()
  const existingIndex = records.findIndex((r) => r.id === record.id)

  if (existingIndex >= 0) {
    records[existingIndex] = record
  } else {
    records.push(record)
  }

  // Sort by date descending
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  localStorage.setItem(STORAGE_KEYS.SLEEP_RECORDS, JSON.stringify(records))
}

export function getSleepRecords(): SleepRecord[] {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEYS.SLEEP_RECORDS)
  return data ? JSON.parse(data) : []
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
  localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings))
}

export function getUserSettings(): UserSettings | null {
  if (typeof window === "undefined") return null

  const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
  if (!data) return null
  
  const settings = JSON.parse(data)
  // Ensure timeFormat exists for existing users (migration)
  if (!settings.timeFormat) {
    settings.timeFormat = "12h"
    saveUserSettings(settings)
  }
  return settings
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

  localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRES, JSON.stringify(questionnaires))
}

export function getQuestionnaires(): WeeklyQuestionnaire[] {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEYS.QUESTIONNAIRES)
  return data ? JSON.parse(data) : []
}

export function shouldShowQuestionnairePrompt(): boolean {
  if (typeof window === "undefined") return false

  // Only show if user has logged sleep
  if (!hasLoggedSleep()) return false

  // Check if 7 days have passed since app start
  const appStartDate = getAppStartDate()
  if (!appStartDate) {
    setAppStartDate()
    return false
  }

  const startDate = new Date(appStartDate)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSince < 7) return false

  // Check if we've already shown a prompt recently
  const lastPrompt = localStorage.getItem(STORAGE_KEYS.LAST_QUESTIONNAIRE_PROMPT)
  if (!lastPrompt) return true

  const lastDate = new Date(lastPrompt)
  const daysSinceLastPrompt = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  return daysSinceLastPrompt >= 7
}

export function setQuestionnairePromptShown(): void {
  localStorage.setItem(STORAGE_KEYS.LAST_QUESTIONNAIRE_PROMPT, new Date().toISOString())
}

// Onboarding
export function setOnboardingComplete(complete: boolean): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete.toString())
}

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false

  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === "true"
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

  // Sort by date descending
  naps.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  localStorage.setItem(STORAGE_KEYS.NAP_RECORDS, JSON.stringify(naps))
}

export function getNapRecords(): NapRecord[] {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEYS.NAP_RECORDS)
  return data ? JSON.parse(data) : []
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
  localStorage.setItem(STORAGE_KEYS.FIRST_SLEEP_LOG_DATE, date)
}

export function getFirstSleepLogDate(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.FIRST_SLEEP_LOG_DATE)
}

// Track app start date for weekly questionnaire
export function setAppStartDate(): void {
  if (typeof window === "undefined") return
  const existing = localStorage.getItem(STORAGE_KEYS.APP_START_DATE)
  if (!existing) {
    localStorage.setItem(STORAGE_KEYS.APP_START_DATE, new Date().toISOString())
  }
}

export function getAppStartDate(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEYS.APP_START_DATE)
}

// Check if user has logged any sleep
export function hasLoggedSleep(): boolean {
  const records = getSleepRecords()
  return records.length > 0
}

// Calculate total debt over last 14 days
// Only counts debt from actual sleep records (not from onboarding or initial setup)
// Naps reduce debt, so subtract nap recovery from total
export function calculateTotalDebt(): number {
  const records = getRecentSleepRecords(14)
  // If no records exist, debt is 0
  if (records.length === 0) {
    return 0
  }
  
  // Sum debt from actual sleep records
  const sleepDebt = records.reduce((total, record) => {
    // Ensure we're only counting valid records with actual sleep data
    if (record.totalSleepMinutes > 0) {
      return total + (record.debtMinutes || 0)
    }
    return total
  }, 0)

  // Subtract nap recovery (naps reduce debt)
  const recentNaps = getRecentNapRecords(14)
  const napRecovery = recentNaps.reduce((total, nap) => {
    return total + (nap.debtReduction || 0)
  }, 0)

  // Debt cannot go below 0
  return Math.max(0, sleepDebt - napRecovery)
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === "undefined") return
  
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
}

// Helper to check if it's morning (6 AM - 12 PM)
export function isMorningTime(): boolean {
  const now = new Date()
  const hour = now.getHours()
  return hour >= 6 && hour < 12
}
