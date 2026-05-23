"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from "react";
import { cn, retrieveRelevantChunks } from "@/lib/utils";
import type { UploadedDocument } from "./DocumentUpload";
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
  FileSearch,
  MessageSquare,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  contextUsed?: boolean;
}

interface ChatInterfaceProps {
  activeDocument: UploadedDocument | null;
  allDocuments: UploadedDocument[];
}

const EXAMPLE_PROMPTS = [
  "Summarize the key points of this document",
  "What are the main conclusions?",
  "Explain the most important concept in simple terms",
  "What questions does this document answer?",
];

function MessageBubble({
  message,
  onCopy,
}: {
  message: Message;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("```")) return null;
      return (
        <span key={i}>
          {line}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser
            ? "bg-gradient-to-br from-purple-600 to-blue-600"
            : "bg-slate-800 border border-slate-700"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-purple-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "group relative max-w-[78%] rounded-2xl px-4 py-3",
          isUser ? "message-user rounded-tr-sm" : "message-assistant rounded-tl-sm"
        )}
      >
        {/* Context badge */}
        {!isUser && message.contextUsed && (
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-700/60">
            <FileSearch className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-400 font-medium">
              Answer from document context
            </span>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "text-sm leading-relaxed prose-dark whitespace-pre-wrap break-words",
            isUser ? "text-white" : "text-slate-200"
          )}
        >
          {renderContent(message.content)}
        </div>

        {/* Timestamp + Copy */}
        <div
          className={cn(
            "flex items-center gap-2 mt-1.5",
            isUser ? "justify-start flex-row-reverse" : "justify-start"
          )}
        >
          <span className="text-[10px] text-slate-500">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-700/50"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-purple-400" />
      </div>
      <div className="message-assistant rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1 h-4">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface({
  activeDocument,
  allDocuments,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!userInput.trim() || isStreaming) return;

      const userMessage: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: userInput.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsStreaming(true);
      setStreamingContent("");

      try {
        // Gather all document chunks across all documents (or active doc)
        const targetDocs =
          activeDocument ? [activeDocument] : allDocuments;

        const allChunks = targetDocs.flatMap((d) => d.chunks);

        // Retrieve relevant context
        let context = "";
        let contextUsed = false;

        if (allChunks.length > 0) {
          const relevant = retrieveRelevantChunks(userInput, allChunks, 5);
          if (relevant.length > 0) {
            context = relevant.join("\n\n---\n\n");
            contextUsed = true;
          }
        }

        // Build messages for API
        const apiMessages = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: userInput.trim() },
        ];

        abortControllerRef.current = new AbortController();

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, context }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Request failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        const assistantMessage: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: fullContent,
          timestamp: new Date(),
          contextUsed,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        const errorMessage: Message = {
          id: `e-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, something went wrong. Please check your API key and try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamingContent("");
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, activeDocument, allDocuments]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    if (streamingContent) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: streamingContent,
          timestamp: new Date(),
        },
      ]);
    }
    setStreamingContent("");
    setIsStreaming(false);
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent("");
  };

  const hasContent = messages.length > 0 || isStreaming;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 glass">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">
              {activeDocument
                ? activeDocument.name
                : allDocuments.length > 0
                ? `${allDocuments.length} document${allDocuments.length > 1 ? "s" : ""} loaded`
                : "Chat"}
            </h2>
          </div>
          {activeDocument && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-[10px] text-purple-300 font-medium">
              RAG Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Zap className="w-3 h-3 text-purple-400" />
            claude-sonnet-4-6
          </span>
          {hasContent && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {/* Empty state */}
        {!hasContent && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/20 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-purple-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {allDocuments.length > 0
                ? "Ready to analyze your documents"
                : "Start a conversation"}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-8">
              {allDocuments.length > 0
                ? "Ask anything about your uploaded documents. I'll find the most relevant passages to answer your questions."
                : "Ask me anything, or upload a document on the left to enable AI-powered document analysis."}
            </p>

            {/* Example prompts */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-400 hover:text-slate-200 transition-all duration-150 leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={copyToClipboard}
          />
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="message-assistant rounded-2xl rounded-tl-sm px-4 py-3 max-w-[78%]">
              <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words prose-dark">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 bg-purple-400 ml-0.5 animate-pulse rounded-sm align-middle" />
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator (while fetching before first chunk) */}
        {isStreaming && !streamingContent && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-6 pb-6 pt-3 border-t border-slate-800/60">
        <div className="relative glow-border rounded-2xl bg-slate-900 border border-slate-700 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              allDocuments.length > 0
                ? "Ask a question about your documents..."
                : "Ask me anything..."
            }
            disabled={isStreaming}
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none max-h-40 leading-relaxed disabled:opacity-50"
          />

          {/* Send / Stop button */}
          <div className="absolute right-3 bottom-2.5 flex items-center gap-1.5">
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-all"
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                Stop
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                  input.trim()
                    ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                )}
                title="Send message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <p className="text-[10px] text-slate-600">
            Press Enter to send, Shift+Enter for new line
          </p>
          {allDocuments.length > 0 && (
            <p className="text-[10px] text-slate-600 flex items-center gap-1">
              <FileSearch className="w-2.5 h-2.5" />
              {activeDocument
                ? "Searching active doc"
                : `Searching ${allDocuments.length} docs`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
