import { Router } from 'express';
import { prisma } from '../db/client.js';
import { requireAuth, AuthenticatedRequest } from '../auth/middleware.js';

const router = Router();

async function ensureAdmin(req: AuthenticatedRequest, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user || user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: admin access required.' });
    return null;
  }
  return user;
}

// List all assistance requests (admin)
router.get('/assistance-requests', requireAuth, async (req: AuthenticatedRequest, res) => {
  const admin = await ensureAdmin(req, res);
  if (!admin) return;

  const requests = await prisma.assistanceRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json({ requests });
});

// Review (approve/reject) a request
router.post('/assistance-requests/:id/review', requireAuth, async (req: AuthenticatedRequest, res) => {
  const admin = await ensureAdmin(req, res);
  if (!admin) return;

  const { id } = req.params;
  const { action, payoutAmount, payoutMethod, payoutReference } = req.body as {
    action: 'approve' | 'reject';
    payoutAmount?: number;
    payoutMethod?: string;
    payoutReference?: string;
  };

  const request = await prisma.assistanceRequest.findUnique({ where: { id } });
  if (!request) return res.status(404).json({ message: 'Request not found.' });

  if (action === 'approve') {
    const updated = await prisma.assistanceRequest.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedByAdminId: admin.id,
        payoutAmount: payoutAmount ?? request.amount ?? null,
        payoutMethod: payoutMethod ?? undefined,
        payoutReference: payoutReference ?? undefined,
      },
    });
    return res.json({ request: updated });
  }

  // reject
  const updated = await prisma.assistanceRequest.update({ where: { id }, data: { status: 'rejected', reviewedByAdminId: admin.id } });
  return res.json({ request: updated });
});

// Mark a request as paid / payout executed
router.post('/assistance-requests/:id/payout', requireAuth, async (req: AuthenticatedRequest, res) => {
  const admin = await ensureAdmin(req, res);
  if (!admin) return;

  const { id } = req.params;
  const { payoutReference } = req.body as { payoutReference?: string };

  const request = await prisma.assistanceRequest.findUnique({ where: { id } });
  if (!request) return res.status(404).json({ message: 'Request not found.' });

  if (request.status !== 'approved') {
    return res.status(400).json({ message: 'Cannot payout a request that is not approved.' });
  }

  const updated = await prisma.assistanceRequest.update({ where: { id }, data: { status: 'paid', payoutSentAt: new Date(), payoutReference: payoutReference ?? undefined } });
  return res.json({ request: updated });
});

export default router;
