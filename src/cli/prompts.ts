import inquirer from "inquirer";
import inquirerFileTreeSelection from "inquirer-file-tree-selection-prompt";
import type { ColumnMapping } from "../types/types";
import path from "path";

inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection);

function getRootDir() {
  const mainPath = process.argv[1];
  if (mainPath.endsWith("ts") || mainPath.endsWith(".js")) {
    // По умолчанию - текущая рабочая директория кода
    return process.cwd();
  }
  // По умолчанию - текущая рабочая директория бинарника
  return path.dirname(process.execPath);
}

export class CliPrompts {
  static async getFilePaths() {
    return inquirer.prompt<{ firstFile: string; secondFile: string }>([
      {
        type: "file-tree-selection" as const,
        name: "firstFile",
        message: "Выберите первый Excel файл:",
        validate: (path: string) =>
          path.endsWith(".xlsx") || path.endsWith(".xls"),
        onlyShowValid: true,
        root: getRootDir(),
      },
      {
        type: "file-tree-selection" as const,
        name: "secondFile",
        message: "Выберите второй Excel файл:",
        validate: (path: string) =>
          path.endsWith(".xlsx") || path.endsWith(".xls"),
        onlyShowValid: true,
        root: getRootDir(),
      },
    ]);
  }

  static async getColumnMapping(): Promise<ColumnMapping> {
    const { columns } = await inquirer.prompt({
      type: "input",
      name: "columns",
      message: 'Введите колонки для сравнения (например "E D"):',
      validate: (input: string) => /^[A-Za-z]+\s+[A-Za-z]+$/.test(input),
    });

    const { threshold } = await inquirer.prompt({
      type: "number",
      name: "threshold",
      message: "Введите порог схожести (0-1):",
    });

    const [sourceColumn, targetColumn] = columns.split(" ");
    return { sourceColumn, targetColumn, threshold };
  }

  static async getTargetTable(): Promise<"первая" | "вторая"> {
    const { target } = await inquirer.prompt({
      type: "list",
      name: "target",
      message: "Выберите целевую таблицу для результатов:",
      choices: ["Первая", "Вторая"],
    });
    return target.toLowerCase() as "первая" | "вторая";
  }
}
