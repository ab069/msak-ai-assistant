import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/utils";

export const runtime = "nodejs";

interface SearchRequestBody {
  query: string;
  chunks: string[];
  topK?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: SearchRequestBody = await req.json();
    const { query, chunks, topK = 5 } = body;

    if (!query || !chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "query and chunks are required" },
        { status: 400 }
      );
    }

    const relevantChunks = retrieveRelevantChunks(query, chunks, topK);

    return NextResponse.json({
      query,
      results: relevantChunks,
      totalChunks: chunks.length,
      returnedChunks: relevantChunks.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
