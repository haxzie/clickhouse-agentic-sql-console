/** `1 row` / `2 rows`. */
export function rowCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'row' : 'rows'}`;
}
