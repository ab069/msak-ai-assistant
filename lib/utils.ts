import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Split text into overlapping chunks for RAG context injection */
export function chunkText(
  text: string,
  chunkSize = 800,
  overlap = 100
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += chunkSize - overlap;
  }

  return chunks.filter((c) => c.length > 20);
}

/** Simple keyword relevance scorer — returns top-k chunks most relevant to query */
export function retrieveRelevantChunks(
  query: string,
  chunks: string[],
  topK = 5
): string[] {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const scored = chunks.map((chunk) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const count = (lower.match(new RegExp(term, "g")) || []).length;
      score += count;
    }
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((s) => s.score > 0)
    .map((s) => s.chunk);
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Extract text content from a File object (PDF/TXT) */
export async function extractTextFromFile(file: File): Promise<string> {
  const text = await file.text();
  // Basic PDF text extraction — strips binary noise, keeps readable chars
  if (file.type === "application/pdf") {
    return text
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{3,}/g, "\n\n")
      .trim();
  }
  return text.trim();
}

/** Generate a short unique ID */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
