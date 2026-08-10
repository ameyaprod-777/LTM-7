import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@prisma/client";
import { enforceRateLimitKey } from "@/lib/rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      status: UserStatus;
      verifiedIdentity: boolean;
      emailVerified: Date | null;
    };
  }

  interface User {
    role: UserRole;
    status: UserStatus;
    verifiedIdentity?: boolean;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    verifiedIdentity: boolean;
    emailVerified: Date | null;
  }
}

/** true si GOOGLE_CLIENT_ID + SECRET sont définis (sinon le bouton OAuth est masqué). */
export function isGoogleAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Mot de passe", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = credentials.email.toLowerCase();
      const rl = enforceRateLimitKey("login", email);
      if (!rl.ok) {
        throw new Error(rl.message);
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user?.passwordHash) {
        return null;
      }

      if (user.status === "BANNED") {
        throw new Error("Compte suspendu. Contactez le support.");
      }

      if (user.status === "SUSPENDED") {
        throw new Error("Compte temporairement suspendu. Contactez le support.");
      }

      const valid = await bcrypt.compare(
        credentials.password,
        user.passwordHash
      );

      if (!valid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        status: user.status,
        verifiedIdentity: user.verifiedIdentity,
        emailVerified: user.emailVerified,
      };
    },
  }),
];

if (isGoogleAuthConfigured()) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    // Nouvel utilisateur Google → identité (email déjà vérifié par Google)
    newUser: "/verify-identity",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session, account, profile }) {
      if (user) {
        token.id = user.id ?? token.id;
        if (user.role) token.role = user.role;
        if (user.status) token.status = user.status;
        token.verifiedIdentity = user.verifiedIdentity ?? false;
        token.emailVerified = user.emailVerified ?? null;
      }

      if (trigger === "update" && session?.user) {
        token.role = session.user.role;
        token.status = session.user.status;
        token.verifiedIdentity =
          session.user.verifiedIdentity ?? token.verifiedIdentity;
      }

      // Nouveau compte Google : parfois seul l’email est fiable au 1er tick
      if (
        !token.id &&
        account?.provider === "google" &&
        (user?.email || profile?.email)
      ) {
        const email = (user?.email || profile?.email || "").toLowerCase();
        if (email) {
          const byEmail = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              role: true,
              status: true,
              verifiedIdentity: true,
              emailVerified: true,
            },
          });
          if (byEmail) {
            token.id = byEmail.id;
            token.role = byEmail.role;
            token.status = byEmail.status;
            token.verifiedIdentity = byEmail.verifiedIdentity;
            token.emailVerified = byEmail.emailVerified;
          }
        }
      }

      const needsDbSync =
        !!token.id &&
        (trigger === "update" ||
          account?.provider === "google" ||
          !token.role ||
          token.verifiedIdentity === undefined);

      if (needsDbSync) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            status: true,
            verifiedIdentity: true,
            emailVerified: true,
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.verifiedIdentity = dbUser.verifiedIdentity;
          token.emailVerified = dbUser.emailVerified;
        }
        // Ne pas invalider le JWT si la sync échoue (course createUser)
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.verifiedIdentity = token.verifiedIdentity;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (existing?.status === "BANNED") {
          return "/login?error=banned";
        }
        if (existing?.status === "SUSPENDED") {
          return "/login?error=suspended";
        }
        if (existing && !existing.emailVerified) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date() },
          });
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // ignore
      }
      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        if (user.email) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              email: user.email.toLowerCase(),
              emailVerified: user.emailVerified ?? new Date(),
            },
          });
        }
        await prisma.platformSettings.upsert({
          where: { id: "default" },
          create: { id: "default" },
          update: {},
        });
      } catch (err) {
        // Ne doit jamais faire échouer l’inscription Google
        console.error("[auth] createUser event:", err);
      }
    },
    async linkAccount({ user, account }) {
      if (account.provider === "google") {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },
};
