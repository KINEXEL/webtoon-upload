import { randomUUID } from "crypto";
import type {
  Adapter,
  AdapterAccount,
  AdapterUser,
} from "next-auth/adapters";
import type { Prisma, User } from "@kinexel/webtoon-db";

import { db } from "@/lib/db";
import { validateUserHandle } from "@/lib/user-handle";

type AccountRow = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

function toAdapterUser(user: User): AdapterUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerifiedAt,
    name: user.name,
    image: user.avatarUrl,
  };
}

function toAdapterAccount(account: AccountRow): AdapterAccount {
  return {
    userId: account.userId,
    type: account.type as AdapterAccount["type"],
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token ?? undefined,
    access_token: account.access_token ?? undefined,
    expires_at: account.expires_at ?? undefined,
    token_type:
      (account.token_type as AdapterAccount["token_type"]) ?? undefined,
    scope: account.scope ?? undefined,
    id_token: account.id_token ?? undefined,
    session_state: account.session_state ?? undefined,
  };
}

function makeSocialHandle(user: AdapterUser): string {
  const source = user.name?.trim() || user.email.split("@")[0] || "user";
  const normalized = source
    .replace(/[^A-Za-z0-9._]+/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 20);
  const base = validateUserHandle(normalized).ok ? normalized : "user";

  return `${base}.${randomUUID().slice(0, 8)}`.slice(0, 30);
}

/**
 * Auth.js의 표준 User 필드명(emailVerified/image)을 기존 도메인 모델의
 * emailVerifiedAt/avatarUrl로 변환한다. JWT 세션이므로 Session 테이블은 사용하지 않는다.
 */
export const oauthAdapter: Adapter = {
  async createUser(user) {
    if (!user.email) {
      throw new Error("OAuth provider did not return an email address");
    }

    const handle = makeSocialHandle(user);
    const created = await db.user.create({
      data: {
        username: handle,
        email: user.email.toLowerCase(),
        emailVerifiedAt: user.emailVerified ?? new Date(),
        name: handle,
        avatarUrl: user.image,
        verified: false,
      },
    });

    return toAdapterUser(created);
  },

  async getUser(id) {
    const user = await db.user.findUnique({ where: { id } });
    return user ? toAdapterUser(user) : null;
  },

  async getUserByEmail(email) {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return user ? toAdapterUser(user) : null;
  },

  async getUserByAccount({ provider, providerAccountId }) {
    const rows = await db.$queryRaw<Array<{ userId: string }>>`
      SELECT "userId"
      FROM "Account"
      WHERE "provider" = ${provider}
        AND "providerAccountId" = ${providerAccountId}
      LIMIT 1
    `;
    const account = rows[0];
    if (!account) return null;

    const user = await db.user.findUnique({ where: { id: account.userId } });
    return user ? toAdapterUser(user) : null;
  },

  async updateUser(user) {
    const data: Prisma.UserUpdateInput = {};
    if (user.email !== undefined) data.email = user.email.toLowerCase();
    if (user.emailVerified !== undefined) {
      data.emailVerifiedAt = user.emailVerified;
    }
    if (user.name != null) data.name = user.name;
    if (user.image !== undefined) data.avatarUrl = user.image;

    const updated = await db.user.update({
      where: { id: user.id },
      data,
    });
    return toAdapterUser(updated);
  },

  async deleteUser(userId) {
    const deleted = await db.user.delete({ where: { id: userId } });
    return toAdapterUser(deleted);
  },

  async linkAccount(account) {
    const id = randomUUID();
    await db.$executeRaw`
      INSERT INTO "Account" (
        "id", "userId", "type", "provider", "providerAccountId",
        "refresh_token", "access_token", "expires_at", "token_type",
        "scope", "id_token", "session_state"
      ) VALUES (
        ${id}, ${account.userId}, ${account.type}, ${account.provider},
        ${account.providerAccountId}, ${account.refresh_token ?? null},
        ${account.access_token ?? null}, ${account.expires_at ?? null},
        ${account.token_type ?? null}, ${account.scope ?? null},
        ${account.id_token ?? null}, ${account.session_state ?? null}
      )
    `;
    return account;
  },

  async unlinkAccount({ provider, providerAccountId }) {
    const rows = await db.$queryRaw<AccountRow[]>`
      DELETE FROM "Account"
      WHERE "provider" = ${provider}
        AND "providerAccountId" = ${providerAccountId}
      RETURNING *
    `;
    return rows[0] ? toAdapterAccount(rows[0]) : undefined;
  },

  async getAccount(providerAccountId, provider) {
    const rows = await db.$queryRaw<AccountRow[]>`
      SELECT *
      FROM "Account"
      WHERE "provider" = ${provider}
        AND "providerAccountId" = ${providerAccountId}
      LIMIT 1
    `;
    return rows[0] ? toAdapterAccount(rows[0]) : null;
  },
};
