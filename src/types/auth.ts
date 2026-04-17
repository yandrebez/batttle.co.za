import type { Role } from "@prisma/client";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: Role;
};
