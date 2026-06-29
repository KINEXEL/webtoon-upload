"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireVerifiedUploader } from "@/lib/auth/session";
import { db } from "@/lib/db";

const episodeSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요."),
  description: z.string().trim().optional(),
  thumbnailUrl: z.string().trim().optional(),
});

export type EpisodeFormValues = {
  title: string;
  description: string;
  thumbnailUrl: string;
  /** 스테이징 에셋(이미지/문단) JSON — 실패 시 미리보기 복원용 */
  assets: string;
};

export type EpisodeFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** 실패 시 입력값 보존 — React 19 폼 액션 후 자동 리셋 대비 */
  values?: EpisodeFormValues;
};

function rawValues(formData: FormData): EpisodeFormValues {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? ""),
    assets: String(formData.get("assets") ?? "[]"),
  };
}

const CONTENT_LANGUAGES = ["EN", "JA", "KO", "ES"] as const;

const stagedAssetSchema = z.array(
  z.object({
    language: z.enum(CONTENT_LANGUAGES),
    kind: z.enum(["image", "text"]),
    value: z.string().trim().min(1),
    variant: z.enum(["CONTENT", "BANNER", "END_BANNER"]),
  }),
);

/** 회차 등록 시 함께 제출된 스테이징 에셋 JSON 파싱 (실패 시 빈 배열) */
function parseStagedAssets(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = stagedAssetSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function parse(formData: FormData) {
  return episodeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    thumbnailUrl: formData.get("thumbnailUrl") ?? undefined,
  });
}

function flatten(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}

/** 본인 소유 작품인지 확인. 작품 메타데이터(제목/타입/뷰어타입 등)는 운영팀만 수정 가능 */
async function requireOwnedSeries(userId: string, seriesId: string) {
  const series = await db.series.findUnique({
    where: { id: seriesId },
    select: { id: true, authorId: true, type: true, defaultViewType: true },
  });
  if (!series || series.authorId !== userId) {
    return null;
  }
  return series;
}

/** 본인 소유 + 아직 발행되지 않은(=관리자 승인 전) 회차인지 확인 */
export async function requireOwnedUnpublishedEpisode(
  userId: string,
  episodeId: string,
) {
  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    include: { series: { select: { id: true, authorId: true, title: true, type: true } } },
  });
  if (!episode || episode.series.authorId !== userId) {
    return { episode: null, error: "회차를 찾을 수 없습니다." } as const;
  }
  if (episode.isPublished) {
    return {
      episode: null,
      error: "이미 발행된 회차는 수정할 수 없습니다.",
    } as const;
  }
  return { episode, error: null } as const;
}

export async function createUploaderEpisodeAction(
  seriesId: string,
  _prev: EpisodeFormState,
  formData: FormData,
): Promise<EpisodeFormState> {
  const user = await requireVerifiedUploader();

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      error: "입력값을 확인하세요.",
      fieldErrors: flatten(parsed.error),
      values: rawValues(formData),
    };
  }
  const data = parsed.data;

  const series = await requireOwnedSeries(user.id, seriesId);
  if (!series) {
    return { error: "작품을 찾을 수 없습니다.", values: rawValues(formData) };
  }

  const last = await db.episode.findFirst({
    where: { seriesId },
    orderBy: { episodeNumber: "desc" },
    select: { episodeNumber: true },
  });
  const episodeNumber = (last?.episodeNumber ?? 0) + 1;

  const stagedAssets = parseStagedAssets(formData.get("assets"));

  const episode = await db.$transaction(async (tx) => {
    const created = await tx.episode.create({
      data: {
        seriesId,
        title: data.title,
        episodeNumber,
        // 뷰어 타입/읽기 방향은 업로더가 선택할 수 없음 — 항상 작품(Series) 설정 상속
        viewType: series.defaultViewType,
        readingDirection: null,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        // 실제 발행 일정은 관리자가 검수 후 백오피스에서 재설정
        publishedAt: new Date(),
        isPublished: false,
      },
    });

    const packs = await Promise.all(
      CONTENT_LANGUAGES.map((language) =>
        tx.episodeGlobalPack.create({
          data: { episodeId: created.id, language },
        }),
      ),
    );
    const packByLanguage = new Map(packs.map((pack) => [pack.language, pack.id]));

    for (const language of CONTENT_LANGUAGES) {
      const languageAssets = stagedAssets.filter((asset) => asset.language === language);
      if (languageAssets.length === 0) continue;

      const globalPackId = packByLanguage.get(language);
      if (!globalPackId) continue;

      await tx.episodeAsset.createMany({
        data: languageAssets.map((asset, i) => ({
          episodeId: created.id,
          globalPackId,
          sortOrder: i + 1,
          variant: asset.variant,
          imageUrl: asset.kind === "image" ? asset.value : null,
          textContent: asset.kind === "text" ? asset.value : null,
        })),
      });
    }

    return created;
  });

  revalidatePath(`/series/${seriesId}`);
  redirect(`/episodes/${episode.id}`);
}

export async function updateUploaderEpisodeAction(
  episodeId: string,
  _prev: EpisodeFormState,
  formData: FormData,
): Promise<EpisodeFormState> {
  const user = await requireVerifiedUploader();

  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      error: "입력값을 확인하세요.",
      fieldErrors: flatten(parsed.error),
      values: rawValues(formData),
    };
  }
  const data = parsed.data;

  const { episode, error } = await requireOwnedUnpublishedEpisode(user.id, episodeId);
  if (!episode) {
    return { error: error ?? "회차를 찾을 수 없습니다.", values: rawValues(formData) };
  }

  await db.episode.update({
    where: { id: episodeId },
    data: {
      title: data.title,
      description: data.description || null,
      thumbnailUrl: data.thumbnailUrl || null,
    },
  });

  revalidatePath(`/episodes/${episodeId}`);
  revalidatePath(`/series/${episode.seriesId}`);
  return {};
}
