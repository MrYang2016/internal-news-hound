/**
 * 判断是否为对象
 * @param {Object} obj
 */
export function isObject(obj: unknown): obj is { [key: string]: unknown } {
  return obj !== null && obj instanceof Object;
}

export function parseJson(content: any): { [key: string]: any } | null {
  try {
    const result = JSON.parse(content);
    if (isObject(result)) {
      return result;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export const HOURS = 60 * 60 * 1000;

export const ONE_DAY = 24 * HOURS;

export const ONE_MONTH = 30 * ONE_DAY;