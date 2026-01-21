import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { db } from "@/lib/firebase";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    // @ts-ignore
    adapter: FirestoreAdapter(db),
    callbacks: {
        async session({ session, user }: any) {
            if (session?.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
