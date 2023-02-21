import { config } from "../config";

let CurrentKeys: string[] = [];

let LocaleMap: Record<string, string> = {};

let compact = true;

export function needLocale(text: string) {
  return text.trim() && !text.trim().startsWith(config.localePrefix);
}

export function getNewKey(text: string) {
  const index = CurrentKeys.length;
  let newKey = config.localePrefix + (config.localeOffset + index);
  if (compact) {
    let existKey = null;
    Object.entries({ ...config.externalLocaleMap, ...LocaleMap }).some(
      ([key, value]) => {
        if (value === text) {
          existKey = key;
        }
      }
    );
    if (existKey) {
      return existKey;
    }
  }
  LocaleMap[newKey] = text;
  CurrentKeys.push(newKey);
  return newKey;
}

export function updateNewKey(keys: string[]) {
  CurrentKeys = [...keys];
  LocaleMap = {};
}

export function getLocaleMap() {
  return LocaleMap;
}

let autoReplace = false;

export function getAutoReplace() {
  return autoReplace;
}

export function setAutoReplace(auto: boolean) {
  autoReplace = auto;
}
