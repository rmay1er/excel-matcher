import { pipeline } from "@xenova/transformers";

export class TextSimilarity {
  private extractor: any;
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.initialize();
  }

  private async initialize() {
    this.extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-mpnet-base-v2",
    );
  }

  public async getTextEmbedding(
    text: string | string[],
  ): Promise<number[] | number[][]> {
    await this.initialized;
    if (Array.isArray(text)) {
      return Promise.all(
        text.map((t) =>
          this.extractor(t, { pooling: "mean", normalize: true }),
        ),
      ).then((results) => results.map((result) => Array.from(result.data)));
    }
    const result = await this.extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(result.data) as number[];
  }

  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce(
      (sum: number, a: number, i: number) => sum + a * vecB[i],
      0,
    );
    const normA = Math.sqrt(
      vecA.reduce((sum: number, a: number) => sum + a * a, 0),
    );
    const normB = Math.sqrt(
      vecB.reduce((sum: number, b: number) => sum + b * b, 0),
    );
    return dotProduct / (normA * normB);
  }

  public async compareTexts(
    source: string,
    candidates: string[],
  ): Promise<{ text: string; similarity: number }[]> {
    const sourceEmbedding = await this.getTextEmbedding(source);
    const candidateEmbeddings = await this.getTextEmbedding(candidates);

    return candidates.map((candidate, i) => ({
      text: candidate,
      similarity: this.cosineSimilarity(
        sourceEmbedding as number[],
        candidateEmbeddings[i] as number[],
      ),
    }));
  }
}

// Пример использования
const similarityChecker = new TextSimilarity();
const source = "The weather is lovely today.";
const candidates = ["It's so sunny outside!", "I am going to the cinema."];

// Получаем результаты сравнения
const results = await similarityChecker.compareTexts(source, candidates);

// Выводим результаты
results.forEach((result) => {
  console.log(
    `Similarity between "${source}" and "${result.text}": ${(result.similarity * 100).toFixed(2)}%`,
  );
  // Ваша логика обработки здесь
});
