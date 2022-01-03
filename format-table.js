/**
 * @typedef {{
 *  headers: string[],
 *  rows: string[][],
 *  maxCellLength: number
 * }} TableOptions
 */

/** @param {TableOptions} tableOptions */
export default function formatTable({ headers, rows, maxCellLength }) {
  const buffer = [];
  for (const row of [headers, ...rows]) {
    const formattedRow = row.map((cell) => {
      const numSpaces = maxCellLength - cell.length;
      if (numSpaces < 0) {
        throw new Error(
          `Expected maxCellLength of ${maxCellLength}, got: ${cell.length}`
        );
      }
      return `${cell}${' '.repeat(numSpaces)}`;
    });
    buffer.push(formattedRow.join(''));
  }
  return [buffer.join('\n')];
}
