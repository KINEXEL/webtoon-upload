"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

type Props = {
  id: string;
  title: string;
  bannerImageUrl: string | null;
  authorName: string;
  type: string;
  status: string;
  episodeCount: number;
  publishedAt: string | null;
};

export function SeriesRow({
  id,
  title,
  bannerImageUrl,
  authorName,
  type,
  status,
  episodeCount,
  publishedAt,
}: Props) {
  const router = useRouter();
  const { dict } = useI18n();
  const href = `/series/${id}`;

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href);
      }}
      tabIndex={0}
      role="link"
    >
      <TableCell className="w-[72px]">
        {bannerImageUrl ? (
          <div className="relative h-10 w-16 overflow-hidden rounded border bg-muted">
            <Image
              src={bannerImageUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-10 w-16 rounded border bg-muted" />
        )}
      </TableCell>
      <TableCell className="font-medium hover:underline">{title}</TableCell>
      <TableCell>{authorName}</TableCell>
      <TableCell>
        <Badge variant="outline">{type}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={status === "COMPLETE" ? "secondary" : "default"}>
          {status === "COMPLETE" ? dict.status.complete : dict.status.ongoing}
        </Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{episodeCount}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {publishedAt ?? dict.status.unpublished}
      </TableCell>
    </TableRow>
  );
}
