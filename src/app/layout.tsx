import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const title = "COMIQUE Upload";
const description =
  "COMIQUE 작가가 본인 작품의 회차 콘텐츠를 업로드하는 사이트";
const siteName = "COMIQUE";
const metaImage = "/metaimg.jpg";

function getMetadataBase() {
  const siteUrl =
    process.env.NEXT_PUBLIC_UPLOAD_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!siteUrl) {
    return undefined;
  }

  return new URL(siteUrl);
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title,
  description,
  keywords: [
    "COMIQUE",
    "웹툰",
    "소설",
    "코믹스",
    "만화",
    "webtoon",
    "novel",
    "comics",
    "backoffice",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.ico?v=2", sizes: "32x32" },
    ],
    shortcut: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.ico?v=2", sizes: "32x32" },
    ],
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName,
    type: "website",
    images: [
      {
        url: metaImage,
        width: 1201,
        height: 601,
        alt: "COMIQUE Upload",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [metaImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Pretendard — 한글+latin 일관 렌더링 (Safari 폴백 폰트 차이 방지). webtoon-app 과 동일 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
