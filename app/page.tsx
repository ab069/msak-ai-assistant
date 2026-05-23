"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import type { UploadedDocument } from "@/components/DocumentUpload";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeDocument = documents.find((d) => d.id === activeDocId) ?? null;

  const handleDocumentUploaded = useCallback((doc: UploadedDocument) => {
    setDocuments((prev) => {
      // Deduplicate by name
      const withoutDuplicate = prev.filter((d) => d.name !== doc.name);
      return [doc, ...withoutDuplicate];
    });
    setActiveDocId(doc.id);
  }, []);

  const handleDocumentSelect = useCallback((id: string) => {
    setActiveDocId((prev) => (prev === id ? null : id));
  }, []);

  const handleDocumentRemove = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setActiveDocId((prev) => (prev === id ? null : prev));
  }, []);

  const handleClearAll = useCallback(() => {
    setDocuments([]);
    setActiveDocId(null);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0a]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className={cn(
          "fixed top-4 z-50 p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all md:hidden",
          sidebarOpen ? "left-[288px]" : "left-4"
        )}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <Sidebar
          documents={documents}
          activeDocId={activeDocId}
          onDocumentSelect={handleDocumentSelect}
          onDocumentUploaded={handleDocumentUploaded}
          onDocumentRemove={handleDocumentRemove}
          onClearAll={handleClearAll}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
        />
      </div>

      {/* Main chat area */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface
          activeDocument={activeDocument}
          allDocuments={documents}
        />
      </main>
    </div>
  );
}
