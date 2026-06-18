/** Client-safe admin checks — no server-only imports. */

export function getAdminUserId(): string | null {
  return process.env.ADMIN_USER_ID?.trim() || null;
}

export function isAdminUser(userId: string | undefined | null): boolean {
  const adminId = getAdminUserId();
  return !!adminId && !!userId && userId === adminId;
}
