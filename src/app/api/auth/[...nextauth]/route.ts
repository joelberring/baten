import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    // Vi använder JWT istället för en databas-adapter för inloggningen.
    // Det är mer robust och gör att vi slipper krångliga inställningar just nu.
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 dagar
    },
    callbacks: {
        async signIn({ user }: any) {
            const allowedEmails = [
                "joel@berring.se",
                "avekob@gmail.com",
                "samuelolundqvist@gmail.com",
            ];

            if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
                return true;
            }
            return false;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session?.user) {
                // @ts-ignore
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
