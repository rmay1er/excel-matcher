import { CliPrompts } from "./src/cli/prompts";
import { ExcelHandler } from "./src/core/excel-handler";
import { Comparator } from "./src/core/comparator";
import type { ComparisonResult } from "./src/types/types";
import { StringIndexer } from "./src/core/indexer";

async function main() {
  console.clear();
  try {
    const startTime = Date.now();
    console.log("⏳ Начало выполнения скрипта...");

    // Обработка прерывания Ctrl+C
    process.on("SIGINT", () => {
      console.log("\n\n⏹️ Выполнение прервано пользователем");
      process.exit(0);
    });

    // Получение входных данных
    console.time("🕒 Время получения входных данных");
    const { firstFile, secondFile } = await CliPrompts.getFilePaths();
    const mapping = await CliPrompts.getColumnMapping();
    const targetTable = await CliPrompts.getTargetTable();
    console.timeEnd("🕒 Время получения входных данных");

    // Чтение данных
    console.time("🕒 Время чтения данных");
    const [firstData, secondData] = await Promise.all([
      ExcelHandler.readColumn(firstFile, mapping.sourceColumn),
      ExcelHandler.readColumn(secondFile, mapping.targetColumn),
    ]);
    console.timeEnd("🕒 Время чтения данных");

    const indexer = new StringIndexer();
    indexer.buildIndex(secondData, 3); // 3 первых символа как ключ

    // Сравнение данных
    console.time("🕒 Время сравнения данных");
    const results = firstData.map((sourceValue) => {
      const candidates = indexer.getCandidates(sourceValue);
      const bestMatch = candidates.reduce(
        (best, targetValue) => {
          const current = Comparator.isMatch(
            sourceValue,
            targetValue,
            mapping.threshold,
          );
          console.log(
            `Сравнение: "${sourceValue}" с "${targetValue}" - схожесть: ${current.similarity}`,
          );
          return current.similarity > best.similarity ? current : best;
        },
        { similarity: 0, match: false } as ComparisonResult,
      );
      return bestMatch;
    });
    console.timeEnd("🕒 Время сравнения данных");

    // Сохранение результатов
    console.time("🕒 Время сохранения результатов");
    const targetFile = targetTable === "первая" ? firstFile : secondFile;
    await ExcelHandler.writeResults(targetFile, results, "Match Status");
    console.timeEnd("🕒 Время сохранения результатов");

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log(
      `✅ Файлы прошли сравнение! Общее время выполнения: ${totalTime} секунд`,
    );
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
