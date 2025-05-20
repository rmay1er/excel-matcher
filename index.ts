import { CliPrompts } from "./src/cli/prompts";
import { ExcelHandler } from "./src/core/excel-handler";
import { Comparator } from "./src/core/comparator";
import type { ComparisonResult } from "./src/types/types";
import { StringIndexer } from "./src/core/indexer";

async function main() {
  console.clear();

  let lastBatchTime: number | null = null;

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

    console.log(`📄 Первый файл: ${firstFile}`);
    console.log(`📄 Второй файл: ${secondFile}`);
    console.log(`🔤 Колонки для сравнения: ${mapping.sourceColumn} -> ${mapping.targetColumn}`);
    console.log(`🎯 Порог схожести: ${mapping.threshold}`);
    console.log(`📊 Результаты сохраняем в: ${targetTable === 'первая' ? 'Первый файл' : 'Второй файл'}`);

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
    const batchSize = 100;
    const results: ComparisonResult[] = [];

    for (let i = 0; i < firstData.length; i += batchSize) {
      const batch = firstData.slice(i, i + batchSize);
      // Параллельная обработка батча
      const batchResults = await Promise.all(
        batch.map(async (sourceValue) => {
          const candidates = indexer.getCandidates(sourceValue);
          let bestMatch: ComparisonResult = { similarity: 0, match: false };
          for (const targetValue of candidates) {
            if (!Comparator.preFilter(sourceValue, targetValue, mapping.threshold)) {
              continue;
            }
            const current = Comparator.isMatch(
              sourceValue,
              targetValue,
              mapping.threshold,
            );
            if (current.similarity > bestMatch.similarity) {
              bestMatch = current;
            }
          }
          return bestMatch;
        }),
      );
      results.push(...batchResults);

      const batchEnd = Math.min(i + batchSize, firstData.length);
      const now = Date.now();
      if (!lastBatchTime) lastBatchTime = now;
      const elapsed = (now - lastBatchTime) / 1000;
      lastBatchTime = now;

      console.log(`Обработано строк: ${batchEnd} из ${firstData.length} (время обработки партии: ${elapsed.toFixed(2)} сек)`);
      console.log(`Кеш Comparator.size: ${Comparator['cache'].size}`);
    }
    console.timeEnd("🕒 Время сравнения данных");

    // Сохранение результатов
    console.time("🕒 Время сохранения результатов");
    const targetFile = targetTable === "первая" ? firstFile : secondFile;
    await ExcelHandler.writeResults(targetFile, results, "Match Status");
    console.timeEnd("🕒 Время сохранения результатов");

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    console.log(
      `✅ Файлы прошли сравнение! Общее время выполнения: ${totalTime.toFixed(2)} секунд`,
    );
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
