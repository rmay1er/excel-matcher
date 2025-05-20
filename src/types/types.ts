export type ColumnMapping = {
  sourceColumn: string;
  targetColumn: string;
  threshold: number;
};

export type ComparisonResult = {
  match: boolean;
  similarity: number;
};
