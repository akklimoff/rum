export function barsLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} тактов`;
  if (last === 1) return `${count} такт`;
  if (last >= 2 && last <= 4) return `${count} такта`;
  return `${count} тактов`;
}
