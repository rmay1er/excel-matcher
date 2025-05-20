import ExcelJS from "exceljs";
import type { ColumnMapping, ComparisonResult } from "../types/types";

export class ExcelHandler {
  static async readColumn(path: string, column: string): Promise<string[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path);
    const worksheet = workbook.worksheets[0];

    return worksheet
      .getColumn(column)
      .values.filter((v, i) => i > 1 && typeof v === "string")
      .map(
        (v) =>
          (v as string)
            .normalize("NFKD")
            .replace(/[^\p{L}\p{N}\s]/gu, "")
            .toLowerCase()
            .replace(/\b(\w+)\b(?=.*\b\1\b)/g, ""), // Удаляем повторяющиеся слова
      );
  }

  static async writeResults(
    path: string,
    results: ComparisonResult[],
    columnName: string,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path);
    const worksheet = workbook.worksheets[0];

    const resultColumn = worksheet.getColumn(worksheet.columnCount + 1);
    resultColumn.values = [
      columnName,
      ...results.map(
        (r) =>
          (r.match ? "Найден" : "Не найден") +
          ` (${(r.similarity * 100).toFixed(2)}%)`,
      ),
    ];

    await workbook.xlsx.writeFile(path);
  }
}
