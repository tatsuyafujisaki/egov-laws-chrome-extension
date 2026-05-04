/**
 * Converts an Arabic numeral to a Japanese numeral string.
 * @param num The Arabic numeral (e.g., 123)
 * @returns The Japanese numeral string (e.g., "百二十三")
 */
export function arabicToJapanese(num: number): string {
  if (num === 0) return "〇";

  const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十", "百", "千"];
  const bigUnits = ["", "万", "億", "兆", "京"];

  let result = "";
  let i = 0;
  while (num > 0) {
    let chunk = num % 10_000;
    let chunkStr = "";
    let j = 0;
    while (chunk > 0) {
      const d = chunk % 10;
      if (d) {
        const digitPart = (d === 1 && j > 0) ? "" : digits[d];
        chunkStr = digitPart + units[j] + chunkStr;
      }
      chunk = Math.floor(chunk / 10);
      j++;
    }
    if (chunkStr) result = chunkStr + bigUnits[i] + result;
    num = Math.floor(num / 10_000);
    i++;
  }
  return result;
}

/**
 * Converts a Japanese numeral string to an Arabic numeral.
 * @param kanji The Japanese numeral string (e.g., "百二十三")
 * @returns The numeric value (e.g., 123)
 */
export function japaneseToArabic(kanji: string): number {
  const digitMap: Record<string, number> = { "〇": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
  const pos: Record<string, number> = { "十": 10, "百": 100, "千": 1_000 };
  const big: Record<string, number> = { "万": 1e4, "億": 1e8, "兆": 1e12, "京": 1e16 };

  let total = 0;
  let section = 0;
  let number = 0;

  for (const ch of kanji) {
    if (ch in digitMap) {
      number = digitMap[ch];
    } else if (ch in pos) {
      section += (number || 1) * pos[ch];
      number = 0;
    } else if (ch in big) {
      total += (section + number || 1) * big[ch];
      section = number = 0;
    }
  }
  return total + section + number;
}
