export const numberToKorean = (num: number): string => {
  if (num === 0) return "영";

  const isNegative = num < 0;
  num = Math.abs(num);

  const units = ["", "십", "백", "천"];
  const bigUnits = ["", "만", "억", "조", "경"];
  const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  let result = "";

  const [integerPart, decimalPart] = num.toString().split(".");
  let intNum = parseInt(integerPart, 10);
  let bigUnitIndex = 0;

  while (intNum > 0) {
    const chunk = intNum % 10000;
    if (chunk > 0) {
      let chunkResult = "";
      let unitIndex = 0;
      let tempChunk = chunk;

      while (tempChunk > 0) {
        const digit = tempChunk % 10;
        if (digit > 0) {
          chunkResult = `${digits[digit]}${units[unitIndex]}${chunkResult}`;
        }
        tempChunk = Math.floor(tempChunk / 10);
        unitIndex++;
      }

      result = `${chunkResult}${bigUnits[bigUnitIndex]} ${result}`;
    }

    intNum = Math.floor(intNum / 10000);
    bigUnitIndex++;
  }

  let decimalResult = "";
  if (decimalPart && parseInt(decimalPart) > 0) {
    decimalResult = " 점 ";
    for (const digit of decimalPart) {
      decimalResult += digits[parseInt(digit, 10)] + " ";
    }
  }

  let finalResult = result.trim();

  if (decimalResult) {
    finalResult += decimalResult.trim();
  }

  return isNegative ? `마이너스 ${finalResult}` : finalResult.trim();
};
