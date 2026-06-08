import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

export const loginService = async (email: string, password: string) => {
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  if (!user.isActive) {
    throw { status: 403, message: 'Account is deactivated' };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
  };

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user: safeUser };
};
