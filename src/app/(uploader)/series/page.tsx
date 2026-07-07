import { PageHeader } from "@/components/page-header";
import { SeriesRow } from "@/components/series/series-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireVerifiedUploaderOrRedirect } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function MySeriesListPage() {
  const user = await requireVerifiedUploaderOrRedirect();
  const dict = await getDict();

  const rows = await db.series.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      _count: { select: { episodes: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={dict.seriesList.title}
        description={dict.seriesList.totalCount(rows.length)}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[72px]">{dict.seriesList.thumbnailCol}</TableHead>
              <TableHead>{dict.seriesList.titleCol}</TableHead>
              <TableHead>{dict.seriesList.authorCol}</TableHead>
              <TableHead>{dict.seriesList.typeCol}</TableHead>
              <TableHead>{dict.seriesList.statusCol}</TableHead>
              <TableHead className="text-right">{dict.seriesList.episodesCol}</TableHead>
              <TableHead>{dict.seriesList.publishedCol}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {dict.seriesList.empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <SeriesRow
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  bannerImageUrl={s.bannerImageUrl}
                  authorName={s.author.name}
                  type={s.type}
                  status={s.status}
                  episodeCount={s._count.episodes}
                  publishedAt={
                    s.publishedAt ? s.publishedAt.toISOString().slice(0, 10) : null
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
