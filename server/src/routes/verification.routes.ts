import { Router } from 'express';
import {
  getVerifications,
  getVerification,
  delegate,
  verify,
  getStats,
  getLogs,
} from '../controllers/verification.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authMiddleware);

router.get('/', getVerifications);
router.get('/stats', requireRole('admin0', 'superAdmin'), getStats);
router.get('/logs', requireRole('admin0', 'superAdmin'), getLogs);
router.get('/:id', getVerification);
router.post('/:id/delegate', requireRole('admin1'), delegate);
router.post('/:id/verify', requireRole('admin1', 'admin2'), verify);

export default router;
