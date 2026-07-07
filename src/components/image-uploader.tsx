"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type Props = {
  prefix?: string;
  onUploaded: (url: string, file: File) => void | Promise<void>;
  className?: string;
  label?: string;
  multiple?: boolean;
  onQueueChange?: (pending: boolean) => void;
};

type UploadProgress = {
  completed: number;
  total: number;
  currentFileName: string;
};

const fileNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function ImageUploader({
  prefix = "uploads",
  onUploaded,
  className,
  label,
  multiple = false,
  onQueueChange,
}: Props) {
  const { dict } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<File[]>([]);
  const processingRef = useRef(false);
  const batchStatsRef = useRef({ total: 0, succeeded: 0, failed: 0 });
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("prefix", prefix);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) throw new Error(data.error ?? dict.assets.uploadAllFailed);
    await onUploaded(data.url, file);
  }

  async function processQueue() {
    if (processingRef.current) return;
    processingRef.current = true;
    setPending(true);
    onQueueChange?.(true);

    while (queueRef.current.length > 0) {
      const file = queueRef.current.shift();
      if (!file) continue;

      const stats = batchStatsRef.current;
      setProgress({
        completed: stats.succeeded + stats.failed,
        total: stats.total,
        currentFileName: file.name,
      });

      try {
        await uploadFile(file);
        stats.succeeded += 1;
      } catch {
        stats.failed += 1;
      }

      setProgress({
        completed: stats.succeeded + stats.failed,
        total: stats.total,
        currentFileName: file.name,
      });
    }

    const { succeeded, failed } = batchStatsRef.current;
    if (failed === 0) {
      toast.success(
        succeeded === 1 ? dict.assets.uploadDone : dict.assets.uploadedN(succeeded),
      );
    } else if (succeeded === 0) {
      toast.error(dict.assets.uploadAllFailed);
    } else {
      toast.warning(dict.assets.uploadPartial(succeeded, failed));
    }

    batchStatsRef.current = { total: 0, succeeded: 0, failed: 0 };
    processingRef.current = false;
    setPending(false);
    setProgress(null);
    onQueueChange?.(false);
  }

  function enqueue(files: FileList | File[]) {
    const candidates = multiple ? Array.from(files) : Array.from(files).slice(0, 1);
    const imageFiles = candidates
      .filter((file) => file.type.startsWith("image/"))
      .sort((a, b) => fileNameCollator.compare(a.name, b.name));

    if (imageFiles.length === 0) {
      toast.error(dict.assets.selectImageFile);
      return;
    }

    queueRef.current.push(...imageFiles);
    batchStatsRef.current.total += imageFiles.length;
    setProgress((current) => ({
      completed: current?.completed ?? 0,
      total: batchStatsRef.current.total,
      currentFileName: current?.currentFileName ?? imageFiles[0].name,
    }));
    void processQueue();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) enqueue(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/50",
        dragOver && "border-ring bg-muted/50",
        pending && "border-primary/50 bg-muted/30",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Upload className="size-5" />
      )}
      <span>
        {pending && progress
          ? dict.assets.uploading(
              Math.min(progress.completed + 1, progress.total),
              progress.total,
            )
          : (label ?? (multiple ? dict.assets.dragMulti : dict.assets.dragSingle))}
      </span>
      {pending && progress ? (
        <span className="max-w-full truncate text-xs">{progress.currentFileName}</span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) enqueue(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
