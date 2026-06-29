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

export const dynamic = "force-dynamic";

export default async function MySeriesListPage() {
  const user = await requireVerifiedUploaderOrRedirect();

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
      <PageHeader title="내 작품" description={`총 ${rows.length}개`} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[72px]">썸네일</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>작가</TableHead>
              <TableHead>타입</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">회차</TableHead>
              <TableHead>발행</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  등록된 작품이 없습니다. 작품 등록은 운영팀에 문의하세요.
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
