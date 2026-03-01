import { NextAuthOptions } from "next-auth";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authoption: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    signOut: "/",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {},
      async authorize(credentials: any) {
        const password = credentials?.password;
        const userIdOrEmail = credentials?.email;
        const validUsers = [
          { email: "Test123@gmail.com", password: "Test@123" },
          { email: "admin1", password: "Test@123" },
        ];
        const match = validUsers.find(
          (u) => u.email === userIdOrEmail && u.password === password
        );
        if (match) {
          return { email: match.email === "admin1" ? "admin1@internetbanking.local" : match.email } as any;
        }
        return null;
      },
    }),
    Github({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },     
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
  debug:true
  
};
