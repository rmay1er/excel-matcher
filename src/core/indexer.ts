export class StringIndexer {
  private index: Map<string, string[]> = new Map();

  buildIndex(values: string[], keyLength = 3): void {
    this.index.clear();
    for (const value of values) {
      const key = value
        .slice(0, keyLength)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (!this.index.has(key)) {
        this.index.set(key, []);
      }
      this.index.get(key)!.push(value);
    }
  }

  getCandidates(value: string, keyLength = 3): string[] {
    const cleanKey = value
      .slice(0, keyLength)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return this.index.get(cleanKey) || [];
  }
}
