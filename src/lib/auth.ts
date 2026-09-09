// NextAuth configuration for FaizERP.
// Uses Credentials provider (email + password) with bcrypt hashing and
// Prisma as the user store. JWT session strategy so we don't need a
// session table.

import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ?? "faizerp-dev-secret-change-in-prod";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email.toLowerCase().trim();
        const user = await db.user.findUnique({
          where: { email },
          include: { business: true },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          // Custom fields — passed through JWT callback below.
          businessId: user.businessId ?? undefined,
          businessName: user.business?.name ?? undefined,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.businessId = (user as any).businessId;
        token.businessName = (user as any).businessName;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error - augmenting session.user with custom fields
        session.user.id = token.id;
        // @ts-expect-error - augmenting session.user with custom fields
        session.user.businessId = token.businessId;
        // @ts-expect-error - augmenting session.user with custom fields
        session.user.businessName = token.businessName;
        // @ts-expect-error - augmenting session.user with custom fields
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    // We don't have a dedicated /login page — login is a modal. NextAuth
    // still needs this configured so its internal routes don't try to
    // redirect to a non-existent default page.
    signIn: "/",
  },
};

// Server-side helper to get the current session in API routes.
export async function getSession() {
  return getServerSession(authOptions);
}

// Returns the authenticated user's businessId, or null if not logged in.
// Throws on DB errors. Use this in API route handlers to scope queries.
export async function getCurrentBusinessId(): Promise<string | null> {
  const session = await getSession();
  // @ts-expect-error - augmenting session.user with custom fields
  return session?.user?.businessId ?? null;
}
