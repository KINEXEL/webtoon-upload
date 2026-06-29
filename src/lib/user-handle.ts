const RESERVED_HANDLES = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "comique",
  "help",
  "login",
  "logout",
  "mail",
  "official",
  "root",
  "search",
  "signup",
  "support",
  "system",
  "webtoon",
  "www",
]);

const DOMAIN_LIKE_PATTERN = /^[a-z0-9][a-z0-9_]*(?:\.[a-z0-9][a-z0-9_]*)+$/i;

export type UserHandleValidationError =
  | "required"
  | "invalid_format"
  | "invalid_length"
  | "invalid_characters"
  | "invalid_pattern";

export function normalizeUserHandle(value: string) {
  return value.trim();
}

export function validateUserHandle(value: string):
  | { ok: true; value: string }
  | { ok: false; error: UserHandleValidationError } {
  const handle = normalizeUserHandle(value);

  if (!handle) {
    return { ok: false, error: "required" };
  }

  if (value !== handle || /\s/.test(value)) {
    return { ok: false, error: "invalid_format" };
  }

  if (handle.length < 1 || handle.length > 30) {
    return { ok: false, error: "invalid_length" };
  }

  if (!/^[A-Za-z0-9._]+$/.test(handle)) {
    return { ok: false, error: "invalid_characters" };
  }

  const normalizedHandle = handle.toLowerCase();

  if (
    handle.startsWith(".") ||
    handle.endsWith(".") ||
    handle.includes("..") ||
    /^\d+$/.test(handle) ||
    DOMAIN_LIKE_PATTERN.test(handle) ||
    RESERVED_HANDLES.has(normalizedHandle)
  ) {
    return { ok: false, error: "invalid_pattern" };
  }

  return { ok: true, value: handle };
}
