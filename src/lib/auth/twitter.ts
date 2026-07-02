const TWITTER_PLACEHOLDER_DOMAIN = "oauth.x.comique.invalid";

export function isTwitterAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_TWITTER_ID?.trim() &&
      process.env.AUTH_TWITTER_SECRET?.trim(),
  );
}

export function createTwitterPlaceholderEmail(providerAccountId: string): string {
  const safeId = providerAccountId.replace(/[^A-Za-z0-9_-]/g, "");
  if (!safeId) throw new Error("Twitter/X provider did not return a valid user ID");
  return `x-${safeId}@${TWITTER_PLACEHOLDER_DOMAIN}`;
}

export function isTwitterPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${TWITTER_PLACEHOLDER_DOMAIN}`);
}
