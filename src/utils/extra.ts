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

export function isKeyExist(key: string) {
  return (
    getPrefixKey(key) in
    {
      ...config.externalLocaleMap,
      ...LocaleMap,
    }
  );
}

export function getPrefixKey(key: string) {
  return `${config.localePrefix}${key}`;
}

export function getNextKey() {
  return config.localePrefix + (config.localeOffset + lastIndex);
}

export function getNewKey(text: string, inputLocaleKey?: string) {
  if (inputLocaleKey) {
    const prefixedKey = getPrefixKey(inputLocaleKey);
    LocaleMap[prefixedKey] = text;
    CurrentKeys.push(prefixedKey);
    return prefixedKey;
  }

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

let autoName = true;

export function getAutoName() {
  return autoName;
}

export function setAutoName(auto: boolean) {
  autoName = auto;
}
