# MSAK AI Assistant

An AI-powered RAG (Retrieval-Augmented Generation) chatbot that lets you upload documents and ask questions about them. Built with Next.js 15, Claude API, and Tailwind CSS.

**Built by [msakithub.com](https://msakithub.com)**

---

## Features

- Upload PDF, TXT, or Markdown documents
- Ask questions — answers grounded in your documents
- Real-time streaming responses via Claude claude-sonnet-4-6
- Keyword-based RAG: relevant document chunks are injected into Claude's context
- Works with multiple documents simultaneously
- Beautiful dark UI with purple/blue gradient accent
- Fully client-side RAG — no database required (just an API key)

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your API key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How it works

### RAG Architecture

This app uses **in-memory RAG** — no vector database required:

1. **Upload** — Document text is extracted on the server (`/api/upload`) and chunked into ~800-character overlapping pieces
2. **Index** — Chunks are returned to the client and stored in React state (localStorage-ready)
3. **Retrieve** — On each message, a keyword-scoring algorithm selects the top-5 most relevant chunks for the query
4. **Augment** — Selected chunks are injected into Claude's system prompt as context
5. **Generate** — Claude streams a response grounded in the document content

### Why no vector embeddings?

Claude doesn't have an embeddings API. This app uses a fast keyword TF-IDF-like scorer (`lib/utils.ts → retrieveRelevantChunks`) that works well for most document Q&A use cases without any external dependencies.

**Want real semantic search?** Switch to:
- **Supabase + pgvector** — uncomment `lib/supabase.ts` usage and store chunks with OpenAI `text-embedding-3-small` embeddings
- **Voyage AI** — Anthropic's recommended embedding provider (voyageai.com)

---

## Project Structure

```
msak-ai-assistant/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Streaming chat endpoint (Claude)
│   │   ├── upload/route.ts     # File upload + text chunking
│   │   └── search/route.ts     # Chunk retrieval (keyword search)
│   ├── globals.css             # Tailwind + custom styles
│   ├── layout.tsx              # Root layout, Inter font
│   └── page.tsx                # Main page (state orchestration)
├── components/
│   ├── ChatInterface.tsx       # Full chat UI with streaming
│   ├── DocumentUpload.tsx      # Drag & drop upload component
│   └── Sidebar.tsx             # Document list sidebar
├── lib/
│   ├── claude.ts               # Anthropic client + model config
│   ├── supabase.ts             # Supabase client (optional)
│   └── utils.ts                # Chunking, retrieval, helpers
└── .env.example
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (optional) |

---

## Tech Stack

| Technology | Usage |
|---|---|
| Next.js 15 | App Router, API routes, streaming |
| TypeScript | Full type safety |
| Tailwind CSS | Styling |
| shadcn/ui primitives | Component foundations |
| @anthropic-ai/sdk | Claude API with streaming |
| @supabase/supabase-js | Vector DB client (optional) |
| lucide-react | Icons |

---

## Production Deployment

Deploy to Vercel in one click:

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` in Environment Variables
4. Deploy

---

## License

MIT — Built by [Abdullah Khan](https://msakithub.com) for msakithub.com
