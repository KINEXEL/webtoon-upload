import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 공유 Prisma 패키지를 서버 번들에서 제외 — 엔진(.node) 경로 해석 유지
  serverExternalPackages: ["@kinexel/webtoon-db"],
};

export default nextConfig;
