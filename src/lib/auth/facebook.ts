const FACEBOOK_PLACEHOLDER_DOMAIN = "oauth.facebook.comique.invalid";

export function isFacebookAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_FACEBOOK_ID?.trim() &&
      process.env.AUTH_FACEBOOK_SECRET?.trim(),
  );
}

export function createFacebookPlaceholderEmail(
  providerAccountId: string,
): string {
  const safeId = providerAccountId.replace(/[^A-Za-z0-9_-]/g, "");
  if (!safeId) throw new Error("Facebook provider did not return a valid user ID");
  return `facebook-${safeId}@${FACEBOOK_PLACEHOLDER_DOMAIN}`;
}

export function isFacebookPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${FACEBOOK_PLACEHOLDER_DOMAIN}`);
}
