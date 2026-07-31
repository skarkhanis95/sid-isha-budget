export function formatMonthKey(monthKey: string): string {
  if (!monthKey || !monthKey.includes("-")) return monthKey;
  const [yearStr, monthStr] = monthKey.split("-");
  const monthIdx = parseInt(monthStr, 10) - 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mName = months[monthIdx] || monthStr;
  return `${yearStr}-${mName}`;
}
