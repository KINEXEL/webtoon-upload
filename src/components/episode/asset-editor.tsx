"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { EpisodeAsset, ViewType } from "@kinexel/webtoon-db";

import {
  addAssetAction,
  deleteAssetAction,
  moveAssetAction,
  updateAssetAction,
} from "@/app/actions/assets";
import { useI18n } from "@/components/i18n-provider";
import { ImageUploader } from "@/components/image-uploader";
import { PreviewImage } from "@/components/episode/preview-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ContentLanguage = "EN" | "JA" | "KO" | "ES";

type AssetPack = {
  language: ContentLanguage;
  assets: EpisodeAsset[];
};

const LANGUAGES: { value: ContentLanguage; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "JA", label: "Japanese" },
  { value: "KO", label: "Korean" },
  { value: "ES", label: "Spanish" },
];

const VARIANTS = ["CONTENT", "BANNER", "END_BANNER"] as const;

/** 이미지 위 오버레이: variant 토글 + 순서 변경 + 삭제 (모두 서버액션) */
function ImageOverlay({ asset, index }: { asset: EpisodeAsset; index: number }) {
  const { dict } = useI18n();
  return (
    <>
      <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white">
        {index + 1}
      </span>

      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        <form action={updateAssetAction} className="flex items-center gap-0.5 rounded bg-black/60 p-0.5">
          <input type="hidden" name="assetId" value={asset.id} />
          {VARIANTS.map((v) => (
            <button
              key={v}
              type="submit"
              name="variant"
              value={v}
              className={
                "rounded px-1.5 py-0.5 text-xs " +
                (asset.variant === v
                  ? "bg-white text-black"
                  : "text-white/80 hover:bg-white/20")
              }
            >
              {dict.assets.variant[v]}
            </button>
          ))}
        </form>

        <div className="flex items-center gap-0.5 rounded bg-black/60 p-0.5">
          <form action={moveAssetAction}>
            <input type="hidden" name="assetId" value={asset.id} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" aria-label={dict.common.moveUp} className="flex size-6 items-center justify-center rounded text-white hover:bg-white/20">
              <ArrowUp className="size-4" />
            </button>
          </form>
          <form action={moveAssetAction}>
            <input type="hidden" name="assetId" value={asset.id} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" aria-label={dict.common.moveDown} className="flex size-6 items-center justify-center rounded text-white hover:bg-white/20">
              <ArrowDown className="size-4" />
            </button>
          </form>
          <form action={deleteAssetAction}>
            <input type="hidden" name="assetId" value={asset.id} />
            <button type="submit" aria-label={dict.common.delete} className="flex size-6 items-center justify-center rounded text-red-300 hover:bg-white/20">
              <Trash2 className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function ImageAssetList({
  assets,
  episodeId,
  language,
}: {
  assets: EpisodeAsset[];
  episodeId: string;
  language: ContentLanguage;
}) {
  const { dict } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      {assets.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">
          {dict.assets.noImages}
        </p>
      ) : (
        assets.map((asset, i) => (
          <div
            key={asset.id}
            className="group relative overflow-hidden rounded-md border bg-muted"
          >
            {asset.imageUrl ? (
              <PreviewImage src={asset.imageUrl} alt={`asset-${i + 1}`} className="block w-full" />
            ) : (
              <div className="h-24 w-full" />
            )}
            <ImageOverlay asset={asset} index={i} />
          </div>
        ))
      )}

      <div className="rounded-md border border-dashed p-3">
        <p className="mb-2 text-sm font-medium">{dict.assets.addImage}</p>
        <ImageUploader
          prefix={`episodes/${episodeId}`}
          multiple
          label={dict.assets.dragMulti}
          onUploaded={async (url) => {
            const fd = new FormData();
            fd.set("episodeId", episodeId);
            fd.set("language", language);
            fd.set("variant", "CONTENT");
            fd.set("imageUrl", url);
            await addAssetAction(fd);
          }}
        />
      </div>
    </div>
  );
}

function TextAssetList({
  assets,
  episodeId,
  language,
}: {
  assets: EpisodeAsset[];
  episodeId: string;
  language: ContentLanguage;
}) {
  const { dict } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      {assets.map((asset, i) => (
        <div key={asset.id} className="flex items-start gap-3 rounded-md border p-3">
          <span className="w-6 pt-2 text-sm tabular-nums text-muted-foreground">
            {i + 1}
          </span>
          <form action={updateAssetAction} className="flex flex-1 flex-col gap-2">
            <input type="hidden" name="assetId" value={asset.id} />
            <Textarea
              name="textContent"
              rows={3}
              defaultValue={asset.textContent ?? ""}
            />
            <div className="flex items-center justify-between">
              <Badge variant="outline">{dict.assets.variant[asset.variant]}</Badge>
              <Button type="submit" variant="outline" size="sm">
                {dict.assets.saveParagraph}
              </Button>
            </div>
          </form>
          <div className="flex flex-col gap-1">
            <form action={moveAssetAction}>
              <input type="hidden" name="assetId" value={asset.id} />
              <input type="hidden" name="direction" value="up" />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label={dict.common.moveUp}>
                <ArrowUp className="size-4" />
              </Button>
            </form>
            <form action={moveAssetAction}>
              <input type="hidden" name="assetId" value={asset.id} />
              <input type="hidden" name="direction" value="down" />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label={dict.common.moveDown}>
                <ArrowDown className="size-4" />
              </Button>
            </form>
            <form action={deleteAssetAction}>
              <input type="hidden" name="assetId" value={asset.id} />
              <Button type="submit" variant="ghost" size="icon-sm" aria-label={dict.common.delete} className="text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      ))}

      <form
        action={addAssetAction}
        className="flex flex-col gap-2 rounded-md border border-dashed p-3"
      >
        <p className="text-sm font-medium">{dict.assets.addParagraph}</p>
        <input type="hidden" name="episodeId" value={episodeId} />
        <input type="hidden" name="language" value={language} />
        <input type="hidden" name="variant" value="CONTENT" />
        <Textarea name="textContent" rows={3} placeholder={dict.assets.paragraphPlaceholder} />
        <div>
          <Button type="submit" size="sm">
            {dict.common.add}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function AssetEditor({
  viewType,
  packs,
  episodeId,
}: {
  viewType: ViewType;
  packs: AssetPack[];
  episodeId: string;
}) {
  const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>("EN");
  const activePack = packs.find((pack) => pack.language === activeLanguage);
  const assets = activePack?.assets ?? [];
  const activeLabel =
    LANGUAGES.find((language) => language.value === activeLanguage)?.label ?? "English";

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-lg bg-muted p-1">
        {LANGUAGES.map((language) => {
          const count =
            packs.find((pack) => pack.language === language.value)?.assets.length ?? 0;

          return (
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
              {language.label} ({count})
            </button>
          );
        })}
      </div>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {activeLabel}
        </h3>
        {viewType === "NOVEL" ? (
          <TextAssetList
            assets={assets}
            episodeId={episodeId}
            language={activeLanguage}
          />
        ) : (
          <ImageAssetList
            assets={assets}
            episodeId={episodeId}
            language={activeLanguage}
          />
        )}
      </section>
    </div>
  );
}
