import { put } from "@vercel/blob";

import { getSessionUploader } from "@/lib/auth/session";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export async function POST(request: Request) {
  const user = await getSessionUploader();
  if (!user || user.isSuspended || !user.verified) {
    return Response.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "BLOB_READ_WRITE_TOKEN 미설정 — Vercel Storage(Blob) 연결 필요." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const prefix = String(form.get("prefix") ?? "uploads");

  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return Response.json({ error: `지원하지 않는 형식: ${file.type}` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "파일이 20MB 를 초과합니다." }, { status: 400 });
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const key = `${prefix}/${crypto.randomUUID()}.${ext}`;

  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
  });

  return Response.json({ url: blob.url });
}
