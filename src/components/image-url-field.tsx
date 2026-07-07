"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { useI18n } from "@/components/i18n-provider";
import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  name: string;
  prefix?: string;
  defaultValue?: string;
};

/** URL 직접 입력 + Blob 업로드 + 미리보기. form 에 `name` 값으로 제출됨. */
export function ImageUrlField({ name, prefix, defaultValue }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const { dict } = useI18n();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={dict.assets.urlPlaceholder}
        />
        {url ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setUrl("")}
            aria-label={dict.common.clear}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {url ? (
        <div className="relative h-32 w-full overflow-hidden rounded-md border bg-muted">
          {/* 외부 도메인 미설정 대비 unoptimized */}
          <Image
            src={url}
            alt="preview"
            fill
            unoptimized
            className="object-contain"
          />
        </div>
      ) : (
        <ImageUploader prefix={prefix} onUploaded={setUrl} />
      )}
    </div>
  );
}
