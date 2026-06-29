"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

type Props = {
  prefix?: string;
  onUploaded: (url: string) => void;
  className?: string;
  label?: string;
};

export function ImageUploader({ prefix = "uploads", onUploaded, className, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  function upload(file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("prefix", prefix);

    startTransition(async () => {
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          toast.error(data.error ?? "업로드 실패");
          return;
        }
        onUploaded(data.url);
        toast.success("업로드 완료");
      } catch {
        toast.error("업로드 중 오류가 발생했습니다.");
      }
    });
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
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/50",
        dragOver && "border-ring bg-muted/50",
        pending && "pointer-events-none opacity-60",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Upload className="size-5" />
      )}
      <span>{pending ? "업로드 중…" : (label ?? "이미지 드래그 또는 클릭")}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
