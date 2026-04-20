import { db } from '../db';
import { staffAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function resetPassword(email: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(staffAccounts)
    .set({ passwordHash: hash })
    .where(eq(staffAccounts.email, email));
  console.log(`✅ Password reset for ${email}`);
  process.exit(0);
}

const email = process.argv[2] || 'chef@pizzaroma.com';
const password = process.argv[3] || 'demo123';

resetPassword(email, password).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});