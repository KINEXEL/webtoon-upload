import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireVerifiedUploaderOrRedirect } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";
import { toDateTimeDisplay } from "@/lib/datetime-local";

export const dynamic = "force-dynamic";

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireVerifiedUploaderOrRedirect();
  const dict = await getDict();

  const series = await db.series.findUnique({
    where: { id },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
        select: {
          id: true,
          episodeNumber: true,
          title: true,
          thumbnailUrl: true,
          viewType: true,
          publishedAt: true,
          isPublished: true,
        },
      },
    },
  });

  if (!series || series.authorId !== user.id) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={series.title}
        description={dict.seriesDetail.meta(series.id)}
        backHref="/series"
      />

      <section className="grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-[120px_1fr]">
        <div className="relative h-36 w-full overflow-hidden rounded border bg-muted sm:h-24 sm:w-24">
          {series.thumbnailUrl ? (
            <Image
              src={series.thumbnailUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{series.type}</Badge>
            <Badge variant={series.status === "COMPLETE" ? "secondary" : "default"}>
              {series.status === "COMPLETE" ? dict.status.complete : dict.status.ongoing}
            </Badge>
            <Badge variant={series.publishedAt ? "default" : "secondary"}>
              {series.publishedAt ? dict.status.published : dict.status.unpublished}
            </Badge>
          </div>
          {series.description ? (
            <p className="text-muted-foreground">{series.description}</p>
          ) : null}
          {series.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {series.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <Separator />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {dict.seriesDetail.episodesHeading(series.episodes.length)}
          </h2>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/series/${series.id}/episodes/new`} />}
          >
            <Plus className="size-4" /> {dict.seriesDetail.addEpisode}
          </Button>
        </div>
        {series.episodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {dict.seriesDetail.noEpisodes}
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {series.episodes.map((ep) => (
              <li
                key={ep.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-muted-foreground">
                    #{ep.episodeNumber}
                  </span>
                  {ep.thumbnailUrl ? (
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                      <Image
                        src={ep.thumbnailUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span className="h-10 w-10 shrink-0 rounded border bg-muted" />
                  )}
                  <Link
                    href={`/episodes/${ep.id}`}
                    className="font-medium hover:underline"
                  >
                    {ep.title}
                  </Link>
                  <Badge variant="outline">{ep.viewType}</Badge>
                  <Badge variant={ep.isPublished ? "default" : "secondary"}>
                    {ep.isPublished ? dict.status.published : dict.status.pendingApproval}
                  </Badge>
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {toDateTimeDisplay(ep.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
