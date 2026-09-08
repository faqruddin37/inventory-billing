/**
 * Converts a currency amount in INR to words formatted for Indian Invoices
 * Example: 1450 -> "Rupees One Thousand Four Hundred Fifty Only"
 */
export function numberToWordsINR(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return "Rupees Zero Only";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    return o ? `${t} ${o}` : t;
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let str = "";
    if (h > 0) {
      str += `${ones[h]} Hundred`;
      if (rest > 0) str += " and ";
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str.trim();
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let result = "";

  const crore = Math.floor(integerPart / 10000000);
  let remainder = integerPart % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundreds = remainder;

  if (crore > 0) {
    result += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    result += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    result += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (hundreds > 0) {
    result += `${convertThreeDigits(hundreds)} `;
  }

  result = result.trim();
  if (!result) result = "Zero";

  let finalString = `Rupees ${result}`;

  if (decimalPart > 0) {
    finalString += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }

  return `${finalString} Only`;
}
