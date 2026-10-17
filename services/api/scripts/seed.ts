import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/db/client.js';
import { config } from '../src/config.js';

async function seed() {
  const phone = process.env.ADMIN_PHONE ?? '+251900000000';
  const password = process.env.ADMIN_PASSWORD ?? 'adminpass';

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.log('Admin user already exists:', existing.phone);
    const token = jwt.sign({ sub: existing.id }, config.jwtSecret, { expiresIn: '7d' });
    console.log('Admin token (use for testing):', token);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });
  console.log('Created admin user with phone:', phone);
  console.log('Admin token (use for testing):', token);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
