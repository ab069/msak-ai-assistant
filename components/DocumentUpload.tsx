"use client";

import React, { useCallback, useRef, useState } from "react";
import { cn, formatFileSize } from "@/lib/utils";
import {
  Upload,
  FileText,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  chunkCount: number;
  fullText: string;
  chunks: string[];
  uploadedAt: string;
}

interface DocumentUploadProps {
  onDocumentUploaded: (doc: UploadedDocument) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export default function DocumentUpload({
  onDocumentUploaded,
  isUploading,
  setIsUploading,
}: DocumentUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setUploadState("uploading");
      setIsUploading(true);
      setErrorMessage("");
      setProgress(0);

      // Fake progress animation
      const progressInterval = setInterval(() => {
        setProgress((p) => (p < 85 ? p + 12 : p));
      }, 200);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const doc: UploadedDocument = await res.json();
        onDocumentUploaded(doc);
        setUploadState("success");

        // Reset after 2 seconds
        setTimeout(() => setUploadState("idle"), 2000);
      } catch (err) {
        clearInterval(progressInterval);
        const msg = err instanceof Error ? err.message : "Upload failed";
        setErrorMessage(msg);
        setUploadState("error");
        setTimeout(() => setUploadState("idle"), 3000);
      } finally {
        setIsUploading(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onDocumentUploaded, setIsUploading]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setUploadState("idle");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState !== "uploading") setUploadState("dragging");
  };

  const onDragLeave = () => {
    if (uploadState === "dragging") setUploadState("idle");
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const stateConfig = {
    idle: {
      border: "border-slate-700 hover:border-purple-500/60",
      bg: "bg-slate-900/40 hover:bg-slate-800/40",
      icon: <Upload className="w-5 h-5 text-slate-400" />,
      text: "Drop file or click to upload",
      subtext: "PDF, TXT, or Markdown • Max 10 MB",
    },
    dragging: {
      border: "border-purple-500",
      bg: "bg-purple-500/10",
      icon: <Upload className="w-5 h-5 text-purple-400 animate-bounce" />,
      text: "Release to upload",
      subtext: "Drop it!",
    },
    uploading: {
      border: "border-blue-500/60",
      bg: "bg-blue-500/5",
      icon: <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />,
      text: "Processing document...",
      subtext: "Chunking and indexing",
    },
    success: {
      border: "border-emerald-500/60",
      bg: "bg-emerald-500/5",
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      text: "Document indexed!",
      subtext: "Ready for questions",
    },
    error: {
      border: "border-red-500/60",
      bg: "bg-red-500/5",
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      text: "Upload failed",
      subtext: errorMessage,
    },
  };

  const config = stateConfig[uploadState];

  return (
    <div className="px-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative rounded-xl border border-dashed p-4 transition-all duration-200 cursor-pointer",
          config.border,
          config.bg
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown,.csv"
          onChange={onFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              uploadState === "dragging" ? "bg-purple-500/20" : "bg-slate-800"
            )}
          >
            {config.icon}
          </div>

          <div>
            <p className="text-xs font-medium text-slate-300">{config.text}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{config.subtext}</p>
          </div>

          {/* Progress bar */}
          {uploadState === "uploading" && (
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Accepted file types badge */}
        <div className="flex gap-1.5 justify-center mt-3">
          {[
            { icon: <FileText className="w-2.5 h-2.5" />, label: "PDF" },
            { icon: <File className="w-2.5 h-2.5" />, label: "TXT" },
            { icon: <File className="w-2.5 h-2.5" />, label: "MD" },
          ].map((t) => (
            <span
              key={t.label}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400"
            >
              {t.icon}
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Small document card used inside the sidebar list
export function DocumentCard({
  doc,
  isActive,
  onSelect,
  onRemove,
}: {
  doc: UploadedDocument;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer transition-all duration-150",
        isActive
          ? "bg-purple-500/15 border border-purple-500/30"
          : "hover:bg-slate-800/60 border border-transparent"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0",
          isActive ? "bg-purple-500/30" : "bg-slate-800"
        )}
      >
        <FileText
          className={cn(
            "w-3.5 h-3.5",
            isActive ? "text-purple-300" : "text-slate-400"
          )}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-medium truncate",
            isActive ? "text-purple-200" : "text-slate-300"
          )}
        >
          {doc.name}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {formatFileSize(doc.size)} • {doc.chunkCount} chunks
        </p>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-500/20"
        aria-label="Remove document"
      >
        <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
      </button>
    </div>
  );
}
