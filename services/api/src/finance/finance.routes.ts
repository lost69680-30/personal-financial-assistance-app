import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from './middleware.js';

const router = Router();

const budgetSchema = z.object({
  category: z.string(),
  limit: z.number(),
  period: z.string().default('monthly'),
});

const goalSchema = z.object({
  title: z.string(),
  target: z.number(),
  deadline: z.string().optional(),
});

const assistanceSchema = z.object({
  title: z.string(),
  reason: z.string(),
  amount: z.number().optional(),
});

router.get('/dashboard', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const [accounts, transactions, budgets, goals, assistanceRequests] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 10 }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.savingsGoal.findMany({ where: { userId } }),
    prisma.assistanceRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const totalIncome = transactions.filter((tx) => tx.direction === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = transactions.filter((tx) => tx.direction === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);

  res.json({
    totalBalance,
    totalIncome,
    totalExpense,
    accounts,
    transactions,
    budgets,
    goals,
    assistanceRequests,
  });
});

router.get('/transactions', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  return res.json({ transactions });
});

router.post('/transactions', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { title, category, amount, direction, date, accountId } = req.body;

  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user!.id,
      title,
      category,
      amount: Number(amount),
      direction,
      date: new Date(date),
      accountId: accountId ?? null,
    },
  });

  return res.status(201).json({ transaction });
});

router.get('/budgets', requireAuth, async (req: AuthenticatedRequest, res) => {
  const budgets = await prisma.budget.findMany({ where: { userId: req.user!.id } });
  return res.json({ budgets });
});

router.post('/budgets', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid budget payload', errors: parsed.error.flatten() });

  const budget = await prisma.budget.create({
    data: {
      userId: req.user!.id,
      category: parsed.data.category,
      limit: parsed.data.limit,
      spent: 0,
      period: parsed.data.period,
    },
  });

  return res.status(201).json({ budget });
});

router.get('/goals', requireAuth, async (req: AuthenticatedRequest, res) => {
  const goals = await prisma.savingsGoal.findMany({ where: { userId: req.user!.id } });
  return res.json({ goals });
});

router.post('/goals', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid goal payload', errors: parsed.error.flatten() });

  const goal = await prisma.savingsGoal.create({
    data: {
      userId: req.user!.id,
      title: parsed.data.title,
      target: parsed.data.target,
      saved: 0,
      deadline: parsed.data.deadline ?? null,
    },
  });

  return res.status(201).json({ goal });
});

router.get('/assistance-requests', requireAuth, async (req: AuthenticatedRequest, res) => {
  const requests = await prisma.assistanceRequest.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ requests });
});

router.post('/assistance-requests', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = assistanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid assistance payload', errors: parsed.error.flatten() });

  const request = await prisma.assistanceRequest.create({
    data: {
      userId: req.user!.id,
      title: parsed.data.title,
      reason: parsed.data.reason,
      amount: parsed.data.amount ?? null,
      status: 'open',
    },
  });

  return res.status(201).json({ request });
});

export default router;
