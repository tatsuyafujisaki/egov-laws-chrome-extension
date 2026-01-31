const japaneseNumeralToArabicNumeral: { [key: string]: number } = {
  '〇': 0,
  '一': 1,
  '二': 2,
  '三': 3,
  '四': 4,
  '五': 5,
  '六': 6,
  '七': 7,
  '八': 8,
  '九': 9,
};

const smallUnits: { [key: string]: number } = {
  '十': 10,
  '百': 100,
  '千': 1_000,
};

const largeUnits: { [key: string]: number } = {
  '万': 10_000,
  '億': 100_000_000,
  '兆': 1_000_000_000_000,
};

export function convertJapaneseNumeralToNumber(text: string): string {
  const pattern = /(?:([〇一二三四五六七八九十百千万億兆]+)分の([〇一二三四五六七八九十百千万億兆]+))|(?:([〇一二三四五六七八九十百千万億兆]+)円)|(?:([〇一二三四五六七八九十百千万億兆]+)年)|(?:([〇一二三四五六七八九十百千万億兆]+)月)|(?:([〇一二三四五六七八九十百千万億兆]+)日)|(?:([〇一二三四五六七八九十百千万億兆]+)人)|(?:([〇一二三四五六七八九十百千万億兆]+)割)|(?:([〇一二三四五六七八九十百千万億兆・]+)パーセント)|(?:([〇一二三四五六七八九十百千万億兆]+)箇月)|(?:([〇一二三四五六七八九十百千万億兆]+)週)|(?:([〇一二三四五六七八九十百千万億兆]+)期)|(?:([〇一二三四五六七八九十百千万億兆]+)親等)|(?:([〇一二三四五六七八九十百千万億兆]+)個)|(?:([〇一二三四五六七八九十百千万億兆]+)歳)|(?:([〇一二三四五六七八九十百千万億兆]+)犯)|(?:第([〇一二三四五六七八九十百千万億兆]+)(?!取得者|債務者|者|方|般))|(?:前([〇一二三四五六七八九十百千万億兆]+)(?!方|般))|(?:の(?!一部)([〇一二三四五六七八九十百千万億兆]+)(?!方|般))|(?:([〇一二三四五六七八九十百千]+)万)/g;

  return text.replace(pattern, (match, fractionDenominator, fractionNumerator, moneyNum, yearNum, monthNum, dayNum,
    personNum, percentNum, percentageNum, monthCountNum, weekNum, kiNum, shintoNum, koNum, saiNum, hanNum, genericOrdinal, genericPrevious, noNum, manNum) => {

    if (fractionDenominator && fractionNumerator) {
      return `${Number(convertString(fractionNumerator)).toLocaleString()}/${Number(convertString(fractionDenominator)).toLocaleString()}`;
    }

    if (moneyNum) {
      const converted = convertString(moneyNum);
      return `${Number(converted).toLocaleString()}円`;
    }

    if (yearNum) return `${Number(convertString(yearNum)).toLocaleString()}年`;
    if (monthNum) return `${Number(convertString(monthNum)).toLocaleString()}月`;
    if (dayNum) return `${Number(convertString(dayNum)).toLocaleString()}日`;
    if (personNum) return `${Number(convertString(personNum)).toLocaleString()}人`;
    if (percentNum) return `${Number(convertString(percentNum)).toLocaleString()}割`;
    if (percentageNum) return `${Number(convertString(percentageNum)).toLocaleString()}%`;
    if (monthCountNum) return `${Number(convertString(monthCountNum)).toLocaleString()}箇月`;
    if (weekNum) return `${Number(convertString(weekNum)).toLocaleString()}週`;
    if (kiNum) return `${Number(convertString(kiNum)).toLocaleString()}期`;
    if (shintoNum) return `${Number(convertString(shintoNum)).toLocaleString()}親等`;
    if (koNum) return `${Number(convertString(koNum)).toLocaleString()}個`;
    if (saiNum) return `${Number(convertString(saiNum)).toLocaleString()}歳`;
    if (hanNum) return `${Number(convertString(hanNum)).toLocaleString()}犯`;

    if (genericOrdinal) return `第${Number(convertString(genericOrdinal)).toLocaleString()}`;
    if (genericPrevious) return `前${Number(convertString(genericPrevious)).toLocaleString()}`;

    if (noNum) {
      return `の${Number(convertString(noNum)).toLocaleString()}`;
    }

    if (manNum) {
      const converted = convertString(manNum);
      const result = Number(converted) * 10000;
      return result.toLocaleString();
    }

    return match;
  }).replace(/箇月/g, 'か月');
}

function convertString(str: string): string {
  // Check if the match is purely digits (positional) or contains units
  const hasUnits = /[十百千万億兆]/.test(str);

  if (!hasUnits) {
    // Positional conversion (e.g., 二〇二四 -> 2024, 〇・一 -> 0.1)
    return str.split('').map(c => c === '・' ? '.' : japaneseNumeralToArabicNumeral[c]).join('');
  } else {
    // Named conversion (e.g., 二千二十四 -> 2024)
    return parseNamedJapaneseNumeral(str).toString();
  }
}

function parseNamedJapaneseNumeral(str: string): number {
  let total = 0;
  let currentBlock = 0; // For numbers less than 10000 (before a large unit)
  let currentDigit = -1; // -1 indicates no digit seen yet in current segment

  for (const char of str) {
    if (japaneseNumeralToArabicNumeral[char] !== undefined) {
        if (currentDigit !== -1) {
            // Case like "五五": not valid in standard named system,
            // but if we encounter digit-digit in a named sequence,
            // usually it implies the previous part was a separate number or it's malformed.
            // For robustness, let's treat it as: shift previous digit to block?
            // Or easier: 1500 (千五百) is valid.
            // But "一五" in named context? "千一五"? -> 1000 + 15?
            // Let's assume standard grammar: Digit -> Unit -> Digit -> Unit.
            // If we see Digit followed by Digit, maybe simpler fallback?
            // Actually, "二十三" (2 10 3).
            // "二百五" (205) -> 2*100 + 5.

             // If we already have a digit waiting to be multiplied, and we get another digit,
             // it usually means the previous digit stands alone (like in the end of a block).
             // But strictly, named numbers don't have adjacent digits without units, except maybe zero?
             // e.g. "百〇八" (108).

             // Simplification: valid numerals usually alternate or follow hierarchy.
             // If we have currentDigit, we add it to currentBlock (implied unit=1) and start new digit.
             currentBlock += currentDigit;
        }
        currentDigit = japaneseNumeralToArabicNumeral[char];
    } else if (smallUnits[char] !== undefined) {
      // Multiply currentDigit by small unit and add to currentBlock
      const digit = currentDigit === -1 ? 1 : currentDigit; // "千" means 1*1000
      currentBlock += digit * smallUnits[char];
      currentDigit = -1;
    } else if (largeUnits[char] !== undefined) {
        // End of a Man/Oku/etc block
        // Must add pending digit first e.g. "一万" -> digit=1. "万" -> digit=-1 (implied 1? No 10000 is 一万 usually)
        // If string starts with "万", it means 10000.

        // If there is a pending digit, add it to current block e.g "二千五万" (25,000,000) -> 2000 + 5 -> 2005 * 10000?
        // No, "二千五百万" is 25000000. "二千五万" is weird.
        // Standard: segment * LargeUnit.

        let segment = currentBlock;
        if (currentDigit !== -1) {
            segment += currentDigit;
            currentDigit = -1;
        }

        // "万" alone -> 1 * 10000 ?
        if (segment === 0) segment = 1;

        total += segment * largeUnits[char];
        currentBlock = 0;
    }
  }

  // Add remainders
  if (currentDigit !== -1) {
      currentBlock += currentDigit;
  }
  total += currentBlock;

  return total;
}
