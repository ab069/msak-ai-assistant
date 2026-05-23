import { anthropic, CLAUDE_MODEL, SYSTEM_PROMPT } from "@/lib/claude";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: Message[];
  context?: string; // RAG-retrieved document chunks
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages, context } = body;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build the system prompt — inject document context if present
    let systemPrompt = SYSTEM_PROMPT;
    if (context && context.trim().length > 0) {
      systemPrompt += `\n\n---\n## Relevant Document Context\n\nThe following excerpts are from the user's uploaded documents. Use them to answer the question:\n\n${context}\n---`;
    }

    // Stream the response from Claude
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Create a ReadableStream that forwards Claude's streaming response
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
