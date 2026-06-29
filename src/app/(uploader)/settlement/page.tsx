import { PageHeader } from "@/components/page-header";
import { PeriodToggle } from "@/components/period-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireVerifiedUploader } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { periodDateFilter, resolvePeriod } from "@/lib/period";

export const dynamic = "force-dynamic";

const COIN_TO_USD = 0.08;

function formatUsd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function SettlementPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; month?: string }>;
}) {
  const user = await requireVerifiedUploader();
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const dateFilter = periodDateFilter(period);

  const [coinAgg, membershipAgg] = await Promise.all([
    db.episodeUnlock.aggregate({
      _sum: { coinsSpent: true },
      where: {
        unlockedAt: dateFilter,
        episode: { series: { authorId: user.id } },
      },
    }),
    db.payment.aggregate({
      _sum: { amountCents: true },
      where: {
        type: "MEMBERSHIP",
        membershipArtistId: user.id,
        status: "SUCCEEDED",
        createdAt: dateFilter,
      },
    }),
  ]);

  const coinsSold = coinAgg._sum.coinsSpent ?? 0;
  const coinRevenueUsd = coinsSold * COIN_TO_USD;
  const membershipRevenueUsd = (membershipAgg._sum.amountCents ?? 0) / 100;
  const totalRevenueUsd = coinRevenueUsd + membershipRevenueUsd;

  const commissionBps = user.authorCommissionBps ?? 0;
  const commissionRatePercent = commissionBps / 100;
  const payoutUsd = totalRevenueUsd * (commissionBps / 10000);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="정산내역" description="내 작품으로 정산받을 금액" />

      <PeriodToggle basePath="/settlement" />

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">{period.label} 정산 금액</p>
        <p className="text-4xl font-semibold tabular-nums">{formatUsd(payoutUsd)}</p>
        {commissionBps === 0 ? (
          <p className="mt-1 text-xs text-destructive">
            수수료율이 설정되어 있지 않습니다. 운영팀에 문의하세요.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">코인 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">{formatUsd(coinRevenueUsd)}</p>
            <p className="text-xs text-muted-foreground">
              {coinsSold.toLocaleString()} 코인 × $0.08
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">멤버십 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">
              {formatUsd(membershipRevenueUsd)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">적용 수수료율</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">{commissionRatePercent}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
