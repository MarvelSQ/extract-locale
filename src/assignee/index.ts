/**
 * transform raw text to local key
 */
export function createAssignee({
  getLocaleKey,
}: {
  getLocaleKey: (text: string | string[]) => string;
}) {
  return {
    getLocaleKey,
  };
}
