export const STORAGE_KEYS = {
  SLEEP_RECORDS: "sleepRecords",
  USER_SETTINGS: "userSettings",
  QUESTIONNAIRES: "questionnaires",
  ONBOARDING_COMPLETE: "onboardingComplete",
  LAST_QUESTIONNAIRE_PROMPT: "lastQuestionnairePrompt",
  NAP_RECORDS: "napRecords",
  FIRST_SLEEP_LOG_DATE: "firstSleepLogDate",
  APP_START_DATE: "appStartDate",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
