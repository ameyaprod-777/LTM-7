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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/apply",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
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
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.verifiedIdentity = user.verifiedIdentity ?? false;
        token.emailVerified = user.emailVerified ?? null;
      }

      if (trigger === "update" && session?.user) {
        token.role = session.user.role;
        token.status = session.user.status;
        token.verifiedIdentity = session.user.verifiedIdentity ?? token.verifiedIdentity;
      }

      if (
        token.id &&
        (trigger === "update" || !token.role || token.verifiedIdentity === undefined)
      ) {
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
        } else {
          // L'utilisateur n'existe plus en base (ex. reset DB). On invalide
          // le token pour forcer une déconnexion propre côté client.
          return {} as typeof token;
        }
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
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (existing?.status === "BANNED" || existing?.status === "SUSPENDED") {
          return false;
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
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async createUser() {
      await prisma.platformSettings.upsert({
        where: { id: "default" },
        create: { id: "default" },
        update: {},
      });
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
