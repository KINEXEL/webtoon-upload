import { PageHeader } from "@/components/page-header";
import { PeriodToggle } from "@/components/period-toggle";
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
import { periodDateFilter, resolvePeriod } from "@/lib/period";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; month?: string }>;
}) {
  const user = await requireVerifiedUploaderOrRedirect();
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const unlockedAt = periodDateFilter(period);

  const grouped = await db.episodeUnlock.groupBy({
    by: ["episodeId"],
    where: {
      unlockedAt,
      episode: { series: { authorId: user.id } },
    },
    _count: { _all: true },
    _sum: { coinsSpent: true },
  });

  const episodes = await db.episode.findMany({
    where: { id: { in: grouped.map((g) => g.episodeId) } },
    select: {
      id: true,
      episodeNumber: true,
      title: true,
      series: { select: { id: true, title: true } },
    },
  });
  const episodeById = new Map(episodes.map((e) => [e.id, e]));

  const rows = grouped
    .map((g) => ({
      episode: episodeById.get(g.episodeId),
      unlockCount: g._count._all,
      coinsSold: g._sum.coinsSpent ?? 0,
    }))
    .filter((row) => row.episode)
    .sort((a, b) => b.coinsSold - a.coinsSold);

  const totalCoins = rows.reduce((sum, row) => sum + row.coinsSold, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="결제내역" description="내 작품 회차의 코인 결제 현황" />

      <PeriodToggle basePath="/payments" />

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">{period.label} 종합 판매 코인수</p>
        <p className="text-3xl font-semibold tabular-nums">
          {totalCoins.toLocaleString()} 코인
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>작품</TableHead>
              <TableHead>회차</TableHead>
              <TableHead className="text-right">결제 건수</TableHead>
              <TableHead className="text-right">판매 코인</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  해당 기간에 결제된 회차가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.episode!.id}>
                  <TableCell>{row.episode!.series.title}</TableCell>
                  <TableCell>
                    #{row.episode!.episodeNumber} {row.episode!.title}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.unlockCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.coinsSold.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
