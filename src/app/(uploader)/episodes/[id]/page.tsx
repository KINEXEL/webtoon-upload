import { notFound } from "next/navigation";

import { updateUploaderEpisodeAction } from "@/app/actions/episodes";
import { AssetEditor } from "@/components/episode/asset-editor";
import { EpisodeForm } from "@/components/episode/episode-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { requireVerifiedUploaderOrRedirect } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";
import { toDateTimeDisplay } from "@/lib/datetime-local";

export const dynamic = "force-dynamic";

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireVerifiedUploaderOrRedirect();
  const dict = await getDict();

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
        <span className="text-muted-foreground">{dict.episodeDetail.publishedAtLabel}</span>
        <span className="font-medium">{toDateTimeDisplay(episode.publishedAt)}</span>
        <Badge variant={episode.isPublished ? "default" : "secondary"}>
          {episode.isPublished ? dict.status.publishedDone : dict.status.pendingApproval}
        </Badge>
        {isLocked ? (
          <span className="text-muted-foreground">{dict.episodeDetail.lockedNotice}</span>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {dict.episodeDetail.infoHeading}
          </h2>
          {isLocked ? (
            <p className="text-sm text-muted-foreground">
              {dict.episodeForm.title}: {episode.title}
              {episode.description ? (
                <>
                  <br />
                  {dict.episodeForm.description}: {episode.description}
                </>
              ) : null}
            </p>
          ) : (
            <EpisodeForm
              action={updateAction}
              episode={episode}
              submitLabel={dict.common.save}
            />
          )}
        </section>

        <section className="lg:border-l lg:pl-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {dict.episodeDetail.contentHeading(episode.viewType, episode._count.assets)}
          </h2>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {isLocked ? (
              <p className="text-sm text-muted-foreground">
                {dict.episodeDetail.lockedContent}
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
