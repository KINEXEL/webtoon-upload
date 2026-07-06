"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { ViewType } from "@kinexel/webtoon-db";

import type { EpisodeFormState } from "@/app/actions/episodes";
import { ImageUploader } from "@/components/image-uploader";
import { ImageUrlField } from "@/components/image-url-field";
import { PreviewImage } from "@/components/episode/preview-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Variant = "CONTENT" | "BANNER" | "END_BANNER";
type ContentLanguage = "EN" | "JA" | "KO" | "ES";
type StagedAsset = {
  id: string;
  language: ContentLanguage;
  kind: "image" | "text";
  value: string;
  variant: Variant;
};

const VARIANT_LABEL: Record<Variant, string> = {
  CONTENT: "본문",
  BANNER: "배너",
  END_BANNER: "엔드배너",
};
const VARIANTS: Variant[] = ["CONTENT", "BANNER", "END_BANNER"];
const LANGUAGES: { value: ContentLanguage; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "JA", label: "Japanese" },
  { value: "KO", label: "Korean" },
  { value: "ES", label: "Spanish" },
];

type Props = {
  action: (state: EpisodeFormState, formData: FormData) => Promise<EpisodeFormState>;
  defaultEpisodeNumber: number;
  defaultViewType: ViewType;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function SubmitButton({ uploadingImages }: { uploadingImages: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || uploadingImages}>
      {pending ? "등록 중…" : uploadingImages ? "이미지 업로드 중…" : "등록"}
    </Button>
  );
}

export function EpisodeUploadForm({
  action,
  defaultEpisodeNumber,
  defaultViewType,
}: Props) {
  const [state, formAction] = useActionState<EpisodeFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const v = state.values;

  const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>("EN");
  const [assets, setAssets] = useState<StagedAsset[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const uid = useId();
  const activeAssets = assets.filter((asset) => asset.language === activeLanguage);

  function move(index: number, dir: -1 | 1) {
    setAssets((prev) => {
      const languageAssets = prev.filter((asset) => asset.language === activeLanguage);
      const target = index + dir;
      if (target < 0 || target >= languageAssets.length) return prev;

      const orderedIds = languageAssets.map((asset) => asset.id);
      [orderedIds[index], orderedIds[target]] = [orderedIds[target], orderedIds[index]];
      let languageIndex = 0;
      return prev.map((asset) => {
        if (asset.language !== activeLanguage) return asset;
        const nextId = orderedIds[languageIndex++];
        return prev.find((candidate) => candidate.id === nextId) ?? asset;
      });
    });
  }
  function remove(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }
  function setVariant(id: string, variant: Variant) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, variant } : a)));
  }
  function setText(id: string, value: string) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, value } : a)));
  }
  function addImage(url: string) {
    setAssets((prev) => [
      ...prev,
      {
        id: `${uid}-${prev.length}-${Date.now()}`,
        language: activeLanguage,
        kind: "image",
        value: url,
        variant: "CONTENT",
      },
    ]);
  }
  function addText(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAssets((prev) => [
      ...prev,
      {
        id: `${uid}-${prev.length}-${Date.now()}`,
        language: activeLanguage,
        kind: "text",
        value: trimmed,
        variant: "CONTENT",
      },
    ]);
  }

  // 액션으로 넘길 직렬화 (kind/value/variant 만)
  const serialized = JSON.stringify(
    assets.map((a) => ({
      language: a.language,
      kind: a.kind,
      value: a.value,
      variant: a.variant,
    })),
  );

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-2">
      <input type="hidden" name="assets" value={serialized} />

      {/* 좌측: 회차 정보 */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          <p>회차 번호: #{defaultEpisodeNumber} (자동 부여)</p>
          <p>뷰어 타입: {defaultViewType} (작품 기본 설정 따름)</p>
          <p>발행일시·발행 여부는 운영팀 검수 후 결정됩니다. 등록 시 항상 미발행 상태로 저장됩니다.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" defaultValue={v?.title ?? ""} />
          <FieldError message={fe.title} />
        </div>

        <div className="flex flex-col gap-2">
          <Label>회차 썸네일</Label>
          <ImageUrlField name="thumbnailUrl" prefix="episodes/new" defaultValue={v?.thumbnailUrl} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">설명</Label>
          <Textarea id="description" name="description" rows={2} defaultValue={v?.description ?? ""} />
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

        <div>
          <SubmitButton uploadingImages={uploadingImages} />
        </div>
      </div>

      {/* 우측: 콘텐츠 미리보기 */}
      <div className="lg:border-l lg:pl-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            콘텐츠 미리보기 — {defaultViewType} ({activeAssets.length})
          </h2>
          <div className="inline-flex rounded-lg bg-muted p-1">
            {LANGUAGES.map((language) => (
              <button
                key={language.value}
                type="button"
                onClick={() => setActiveLanguage(language.value)}
                className={
                  "rounded-md px-2.5 py-1 text-xs font-medium transition " +
                  (activeLanguage === language.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pr-1">
          {activeAssets.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
              아직 추가된 콘텐츠가 없습니다. 아래에서 추가하세요.
            </p>
          ) : (
            activeAssets.map((asset, i) =>
              asset.kind === "image" ? (
                <div key={asset.id} className="group relative overflow-hidden rounded-md border bg-muted">
                  <PreviewImage src={asset.value} alt={`asset-${i + 1}`} className="block w-full" />
                  <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
                    {i + 1}
                  </span>
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                    <div className="flex items-center gap-0.5 rounded bg-black/60 p-0.5">
                      {VARIANTS.map((variant) => (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => setVariant(asset.id, variant)}
                          className={
                            "rounded px-1.5 py-0.5 text-xs " +
                            (asset.variant === variant ? "bg-white text-black" : "text-white/80 hover:bg-white/20")
                          }
                        >
                          {VARIANT_LABEL[variant]}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-0.5 rounded bg-black/60 p-0.5">
                      <button type="button" onClick={() => move(i, -1)} aria-label="위로" className="flex size-6 items-center justify-center rounded text-white hover:bg-white/20">
                        <ArrowUp className="size-4" />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} aria-label="아래로" className="flex size-6 items-center justify-center rounded text-white hover:bg-white/20">
                        <ArrowDown className="size-4" />
                      </button>
                      <button type="button" onClick={() => remove(asset.id)} aria-label="삭제" className="flex size-6 items-center justify-center rounded text-red-300 hover:bg-white/20">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={asset.id} className="flex items-start gap-3 rounded-md border p-3">
                  <span className="w-6 pt-2 text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                  <div className="flex flex-1 flex-col gap-2">
                    <Textarea
                      rows={3}
                      value={asset.value}
                      onChange={(e) => setText(asset.id, e.target.value)}
                    />
                    <Badge variant="outline" className="w-fit">{VARIANT_LABEL[asset.variant]}</Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="위로" onClick={() => move(i, -1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="아래로" onClick={() => move(i, 1)}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="삭제" className="text-destructive" onClick={() => remove(asset.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ),
            )
          )}

          {/* 끝에 추가 기능 */}
          {defaultViewType === "NOVEL" ? (
            <TextAdder onAdd={addText} />
          ) : (
            <div className="rounded-md border border-dashed p-3">
              <p className="mb-2 text-sm font-medium">이미지 추가</p>
              <ImageUploader
                prefix="episodes/new"
                multiple
                label="이미지 여러 장 드래그 또는 클릭"
                onUploaded={addImage}
                onQueueChange={setUploadingImages}
              />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

function TextAdder({ onAdd }: { onAdd: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed p-3">
      <p className="text-sm font-medium">문단 추가</p>
      <Textarea
        rows={3}
        placeholder="문단 내용…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onAdd(value);
            setValue("");
          }}
        >
          추가
        </Button>
      </div>
    </div>
  );
}
