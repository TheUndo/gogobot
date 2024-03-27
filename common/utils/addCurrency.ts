export function addCurrency(currency = "$") {
  return (amount: number | string) => `${currency}${amount}`;
}
