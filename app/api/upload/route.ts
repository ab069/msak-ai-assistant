import { NextRequest, NextResponse } from "next/server";
import { chunkText, generateId } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "text/markdown",
      "text/csv",
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, TXT, or Markdown files." },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    // Read file content
    let rawText = await file.text();

    // For PDFs, strip binary noise and keep printable characters
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      rawText = rawText
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{3,}/g, "\n\n")
        .trim();
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this file. For PDFs with scanned images, please use a text-based PDF.",
        },
        { status: 400 }
      );
    }

    // Chunk the text for RAG retrieval
    const chunks = chunkText(rawText, 800, 100);

    const documentId = generateId();

    return NextResponse.json({
      id: documentId,
      name: file.name,
      size: file.size,
      type: file.type,
      chunkCount: chunks.length,
      // Return full text — stored client-side for in-memory RAG
      // In production, replace with Supabase vector insertion
      fullText: rawText,
      chunks,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
