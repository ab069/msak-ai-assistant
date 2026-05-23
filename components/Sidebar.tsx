"use client";

import React from "react";
import { cn } from "@/lib/utils";
import DocumentUpload, {
  DocumentCard,
  type UploadedDocument,
} from "./DocumentUpload";
import {
  Bot,
  BookOpen,
  ExternalLink,
  Trash2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  documents: UploadedDocument[];
  activeDocId: string | null;
  onDocumentSelect: (id: string) => void;
  onDocumentUploaded: (doc: UploadedDocument) => void;
  onDocumentRemove: (id: string) => void;
  onClearAll: () => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
}

export default function Sidebar({
  documents,
  activeDocId,
  onDocumentSelect,
  onDocumentUploaded,
  onDocumentRemove,
  onClearAll,
  isUploading,
  setIsUploading,
}: SidebarProps) {
  return (
    <aside className="flex flex-col h-full bg-[#1a1a2e] border-r border-slate-800/60 w-72 flex-shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a1a2e]" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-tight">
            MSAK AI
          </h1>
          <p className="text-[10px] text-slate-500 font-medium">
            Document Assistant
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="py-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between px-4 mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Upload Document
          </span>
        </div>
        <DocumentUpload
          onDocumentUploaded={onDocumentUploaded}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
        />
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" />
            Documents
            {documents.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-bold">
                {documents.length}
              </span>
            )}
          </span>
          {documents.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 transition-colors"
              title="Remove all documents"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              No documents yet.
              <br />
              Upload a file to enable RAG.
            </p>
          </div>
        ) : (
          <div className="px-2 space-y-1">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isActive={activeDocId === doc.id}
                onSelect={() => onDocumentSelect(doc.id)}
                onRemove={() => onDocumentRemove(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active document indicator */}
      {activeDocId && documents.length > 0 && (
        <div className="mx-3 mb-3 px-3 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <p className="text-[11px] text-purple-300 leading-snug">
              RAG active — answers grounded in selected document
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-800/60">
        <a
          href="https://msakithub.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-300 transition-colors group"
        >
          <span className="font-medium">msakithub.com</span>
          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
        <p className="text-[10px] text-slate-600 mt-1">
          Powered by Claude claude-sonnet-4-6
        </p>
      </div>
    </aside>
  );
}
