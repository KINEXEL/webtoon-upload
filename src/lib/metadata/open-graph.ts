import type { Metadata } from "next";

const SITE_NAME = "COMIQUE";
const DEFAULT_IMAGE_PATH = "/metaimg.jpg";

function getSiteUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_UPLOAD_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    process.env.AUTH_URL ??
    "http://localhost:3002";

  return rawUrl.replace(/\/$/, "");
}

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}

export function getDefaultOpenGraphMetadata({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(DEFAULT_IMAGE_PATH);

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      url,
      title,
      description,
      type: "website",
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1201,
          height: 601,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
