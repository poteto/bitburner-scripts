/**
 * @typedef {{
 *  headers: string[],
 *  rows: string[][],
 *  columnLengths: number[]
 * }} TableOptions
 */

/** @param {TableOptions} tableOptions */
export default function formatTable({ headers, rows, columnLengths }) {
  const buffer = [];
  for (const row of [headers, ...rows]) {
    const formattedRow = row.map((cell, index) => {
      const maxCellLength = columnLengths[index];
      const numSpaces = maxCellLength - cell.length;
      if (numSpaces < 0) {
        throw new Error(
          `Expected column #${index} to have maxCellLength of ${maxCellLength}, got: ${cell.length}`
        );
      }
      return `${cell}${' '.repeat(numSpaces)}`;
    });
    buffer.push(formattedRow.join(''));
  }
  return buffer.join('\n');
}
