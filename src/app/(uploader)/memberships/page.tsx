import { differenceInCalendarMonths, differenceInCalendarDays } from "date-fns";
import type { Prisma } from "@kinexel/webtoon-db";

import { PageHeader } from "@/components/page-header";
import { PeriodToggle } from "@/components/period-toggle";
import { Badge } from "@/components/ui/badge";
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
import { resolvePeriod } from "@/lib/period";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "구독중",
  CANCELED: "해지",
  EXPIRED: "만료",
};

export default async function MembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; month?: string }>;
}) {
  const user = await requireVerifiedUploaderOrRedirect();
  const sp = await searchParams;
  const period = resolvePeriod(sp);

  // 선택한 기간(월)과 구독 기간이 겹치면 "유지"로 간주. 전체보기는 누적 전체.
  const where: Prisma.MembershipWhereInput = { artistId: user.id };
  if (period.mode === "month" && period.start && period.end) {
    where.createdAt = { lte: period.end };
    where.OR = [{ canceledAt: null }, { canceledAt: { gt: period.start } }];
  }

  const memberships = await db.membership.findMany({
    where,
    include: { member: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="멤버십내역" description="내 멤버십 구독자 현황" />

      <PeriodToggle basePath="/memberships" />

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">{period.label} 유지 구독자 수</p>
        <p className="text-3xl font-semibold tabular-nums">
          {memberships.length.toLocaleString()}명
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>구독자</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="text-right">경과일</TableHead>
              <TableHead className="text-right">구독 개월수</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  해당 기간에 유지된 구독자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              memberships.map((m) => {
                const elapsedDays = differenceInCalendarDays(now, m.createdAt);
                const months = differenceInCalendarMonths(now, m.createdAt) + 1;
                return (
                  <TableRow key={`${m.memberId}-${m.artistId}`}>
                    <TableCell>
                      <div className="font-medium">{m.member.name}</div>
                      <div className="text-xs text-muted-foreground">{m.member.email}</div>
                    </TableCell>
                    <TableCell>{m.createdAt.toISOString().slice(0, 10)}</TableCell>
                    <TableCell className="text-right tabular-nums">{elapsedDays}일</TableCell>
                    <TableCell className="text-right tabular-nums">{months}개월</TableCell>
                    <TableCell>
                      <Badge variant={m.status === "ACTIVE" ? "default" : "secondary"}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
