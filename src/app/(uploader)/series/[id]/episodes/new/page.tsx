import { notFound } from "next/navigation";

import { createUploaderEpisodeAction } from "@/app/actions/episodes";
import { EpisodeUploadForm } from "@/components/episode/episode-upload-form";
import { PageHeader } from "@/components/page-header";
import { requireVerifiedUploader } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireVerifiedUploader();
  const { id: seriesId } = await params;

  const series = await db.series.findUnique({
    where: { id: seriesId },
    select: { id: true, title: true, authorId: true, defaultViewType: true },
  });
  if (!series || series.authorId !== user.id) notFound();

  const last = await db.episode.findFirst({
    where: { seriesId },
    orderBy: { episodeNumber: "desc" },
    select: { episodeNumber: true },
  });

  const action = createUploaderEpisodeAction.bind(null, seriesId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="회차 등록"
        description={series.title}
        backHref={`/series/${series.id}`}
      />
      <EpisodeUploadForm
        action={action}
        defaultEpisodeNumber={(last?.episodeNumber ?? 0) + 1}
        defaultViewType={series.defaultViewType}
      />
    </div>
  );
}
