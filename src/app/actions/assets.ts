"use server";

import { revalidatePath } from "next/cache";

import { requireOwnedUnpublishedEpisode } from "@/app/actions/episodes";
import { requireVerifiedUploader } from "@/lib/auth/session";
import { db } from "@/lib/db";

type AssetVariant = "CONTENT" | "BANNER" | "END_BANNER";
type ContentLanguage = "EN" | "JA" | "KO" | "ES";

const CONTENT_LANGUAGES = ["EN", "JA", "KO", "ES"] as const;

function normalizeLanguage(value: FormDataEntryValue | null): ContentLanguage {
  const language = String(value ?? "EN");
  return CONTENT_LANGUAGES.includes(language as ContentLanguage)
    ? (language as ContentLanguage)
    : "EN";
}

async function revalidateEpisode(episodeId: string) {
  revalidatePath(`/episodes/${episodeId}`);
}

async function getOrCreatePack(episodeId: string, language: ContentLanguage) {
  return db.episodeGlobalPack.upsert({
    where: { episodeId_language: { episodeId, language } },
    update: {},
    create: { episodeId, language },
  });
}

/** 이미지/문단 에셋 추가. sortOrder = 현재 max + 1 */
export async function addAssetAction(formData: FormData): Promise<void> {
  const user = await requireVerifiedUploader();
  const episodeId = String(formData.get("episodeId") ?? "");
  if (!episodeId) return;

  const { episode } = await requireOwnedUnpublishedEpisode(user.id, episodeId);
  if (!episode) return;

  const language = normalizeLanguage(formData.get("language"));
  const variant = String(formData.get("variant") ?? "CONTENT") as AssetVariant;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const textContent = String(formData.get("textContent") ?? "").trim() || null;
  if (!imageUrl && !textContent) return;

  const pack = await getOrCreatePack(episodeId, language);
  const last = await db.episodeAsset.findFirst({
    where: { globalPackId: pack.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.episodeAsset.create({
    data: {
      episodeId,
      globalPackId: pack.id,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      variant,
      imageUrl,
      textContent,
    },
  });

  await revalidateEpisode(episodeId);
}

export async function updateAssetAction(formData: FormData): Promise<void> {
  const user = await requireVerifiedUploader();
  const assetId = String(formData.get("assetId") ?? "");
  if (!assetId) return;

  const asset = await db.episodeAsset.findUnique({ where: { id: assetId } });
  if (!asset) return;

  const { episode } = await requireOwnedUnpublishedEpisode(user.id, asset.episodeId);
  if (!episode) return;

  const variant = (String(formData.get("variant") ?? asset.variant) as AssetVariant);
  const imageUrl = formData.has("imageUrl")
    ? String(formData.get("imageUrl") ?? "").trim() || null
    : asset.imageUrl;
  const textContent = formData.has("textContent")
    ? String(formData.get("textContent") ?? "").trim() || null
    : asset.textContent;

  await db.episodeAsset.update({
    where: { id: assetId },
    data: { variant, imageUrl, textContent },
  });
  await revalidateEpisode(asset.episodeId);
}

export async function deleteAssetAction(formData: FormData): Promise<void> {
  const user = await requireVerifiedUploader();
  const assetId = String(formData.get("assetId") ?? "");
  if (!assetId) return;

  const asset = await db.episodeAsset.findUnique({ where: { id: assetId } });
  if (!asset) return;

  const { episode } = await requireOwnedUnpublishedEpisode(user.id, asset.episodeId);
  if (!episode) return;

  await db.episodeAsset.delete({ where: { id: assetId } });
  await revalidateEpisode(asset.episodeId);
}

/** 위/아래 이웃과 sortOrder 교환. unique(episodeId, sortOrder) 충돌 회피 위해 임시값 사용 */
export async function moveAssetAction(formData: FormData): Promise<void> {
  const user = await requireVerifiedUploader();
  const assetId = String(formData.get("assetId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!assetId || (direction !== "up" && direction !== "down")) return;

  const asset = await db.episodeAsset.findUnique({ where: { id: assetId } });
  if (!asset) return;

  const { episode } = await requireOwnedUnpublishedEpisode(user.id, asset.episodeId);
  if (!episode) return;

  const scope =
    asset.globalPackId !== null
      ? { globalPackId: asset.globalPackId }
      : { episodeId: asset.episodeId };

  const neighbor = await db.episodeAsset.findFirst({
    where:
      direction === "up"
        ? { ...scope, sortOrder: { lt: asset.sortOrder } }
        : { ...scope, sortOrder: { gt: asset.sortOrder } },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;

  await db.$transaction([
    db.episodeAsset.update({ where: { id: asset.id }, data: { sortOrder: -1 } }),
    db.episodeAsset.update({
      where: { id: neighbor.id },
      data: { sortOrder: asset.sortOrder },
    }),
    db.episodeAsset.update({
      where: { id: asset.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
  ]);

  await revalidateEpisode(asset.episodeId);
}
