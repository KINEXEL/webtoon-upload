import { notFound } from "next/navigation";

import { updateUploaderEpisodeAction } from "@/app/actions/episodes";
import { AssetEditor } from "@/components/episode/asset-editor";
import { EpisodeForm } from "@/components/episode/episode-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { requireVerifiedUploader } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { toDateTimeDisplay } from "@/lib/datetime-local";

export const dynamic = "force-dynamic";

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireVerifiedUploader();

  const episode = await db.episode.findUnique({
    where: { id },
    include: {
      series: { select: { id: true, title: true, authorId: true } },
      globalPacks: {
        orderBy: { language: "asc" },
        include: {
          assets: { orderBy: { sortOrder: "asc" } },
        },
      },
      _count: { select: { assets: true } },
    },
  });
  if (!episode || episode.series.authorId !== user.id) notFound();

  const isLocked = episode.isPublished;
  const updateAction = updateUploaderEpisodeAction.bind(null, episode.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`#${episode.episodeNumber} ${episode.title}`}
        description={episode.series.title}
        backHref={`/series/${episode.series.id}`}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-md border p-4 text-sm">
        <span className="text-muted-foreground">발행일시</span>
        <span className="font-medium">{toDateTimeDisplay(episode.publishedAt)}</span>
        <Badge variant={episode.isPublished ? "default" : "secondary"}>
          {episode.isPublished ? "발행됨" : "관리자 승인 대기"}
        </Badge>
        {isLocked ? (
          <span className="text-muted-foreground">
            이미 발행된 회차는 더 이상 수정할 수 없습니다.
          </span>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">회차 정보</h2>
          {isLocked ? (
            <p className="text-sm text-muted-foreground">
              제목: {episode.title}
              {episode.description ? <><br />설명: {episode.description}</> : null}
            </p>
          ) : (
            <EpisodeForm action={updateAction} episode={episode} submitLabel="저장" />
          )}
        </section>

        <section className="lg:border-l lg:pl-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            콘텐츠 — {episode.viewType} ({episode._count.assets})
          </h2>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {isLocked ? (
              <p className="text-sm text-muted-foreground">
                이미 발행된 회차의 콘텐츠는 수정할 수 없습니다.
              </p>
            ) : (
              <AssetEditor
                viewType={episode.viewType}
                packs={episode.globalPacks}
                episodeId={episode.id}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
