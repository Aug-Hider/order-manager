import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/db';
import { staffAccounts, pizzerias } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name: string; role: 'chef' | 'staff'; pizzeriaId: string; pizzeriaName: string };
  }
  interface User { 
    id: string; 
    email: string;
    name: string;
    role: 'chef' | 'staff'; 
    pizzeriaId: string; 
    pizzeriaName: string 
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          const staff = await db.query.staffAccounts.findFirst({
            where: eq(staffAccounts.email, credentials.email),
          });

          console.log('👤 Staff found:', staff?.email);
          console.log('   isActive:', staff?.isActive);
          console.log('   passwordHash exists:', !!staff?.passwordHash);

          if (!staff) {
            console.log('❌ Staff account not found');
            return null;
          }

          if (!staff.isActive) {
            console.log('❌ Staff account is inactive');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, staff.passwordHash);
          console.log('🔐 Password match:', isValid);

          if (!isValid) {
            console.log('❌ Password mismatch');
            return null;
          }

          const pizzeria = await db.query.pizzerias.findFirst({
            where: eq(pizzerias.id, staff.pizzeriaId),
          });

          if (!pizzeria) {
            console.log('❌ Pizzeria not found');
            return null;
          }

          await db.update(staffAccounts)
            .set({ lastLoginAt: new Date() })
            .where(eq(staffAccounts.id, staff.id));

          console.log('✅ Auth success!');

          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role as 'chef' | 'staff',
            pizzeriaId: staff.pizzeriaId,
            pizzeriaName: pizzeria.name,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.pizzeriaId = user.pizzeriaId;
        token.pizzeriaName = user.pizzeriaName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as 'chef' | 'staff';
        session.user.pizzeriaId = token.pizzeriaId as string;
        session.user.pizzeriaName = token.pizzeriaName as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export function requireChef(session: any) {
  if (session?.user?.role !== 'chef') throw new Error('Accès réservé au chef');
}