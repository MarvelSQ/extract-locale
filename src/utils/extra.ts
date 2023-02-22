import { config } from "../config";

let CurrentKeys: string[] = [];

let LocaleMap: Record<string, string> = {};

export function needLocale(text: string) {
  return text.trim() && !text.trim().startsWith(config.localePrefix);
}

let lastIndex = 1;

function generateKey(): string {
  const key = config.localePrefix + (config.localeOffset + lastIndex++);
  if (config.externalLocaleMap.hasOwnProperty(key)) {
    return generateKey();
  }
  return key;
}

export function getNewKey(text: string) {
  const existLocale = Object.entries({
    ...config.externalLocaleMap,
    ...LocaleMap,
  }).find(([key, value]) => {
    if (value === text) {
      return true;
    }
    return false;
  });

  if (existLocale) {
    return existLocale.at(0) as string;
  }

  const newKey = generateKey();
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
