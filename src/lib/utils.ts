export function formatNum(num: number | string): string {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return Math.floor(Number(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
