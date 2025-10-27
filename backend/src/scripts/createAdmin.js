import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

function emailFromId(id) {
  return `${id}@staff.local`;
}

async function main() {
  const staffId = process.env.SEED_ADMIN_ID || '123456';
  const password = process.env.SEED_ADMIN_PASS || '123456';
  const name = process.env.SEED_ADMIN_NAME || 'Seed Admin';

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await connectDB();

  const email = emailFromId(staffId);
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    role: 'admin',
    staffId,
    email,
    passwordHash,
  });

  console.log('Created admin:', user.toJSON());
  process.exit(0);
}

main().catch((e) => {
  console.error('Failed to create admin', e);
  process.exit(1);
});
