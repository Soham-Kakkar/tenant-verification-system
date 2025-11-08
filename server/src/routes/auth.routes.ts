import { Router } from 'express';
import { register, login, changePassword, adminChangePassword } from '../controllers/auth.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router: Router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authMiddleware, changePassword);
router.post('/admin/change-password', authMiddleware, requireRole('superAdmin'), adminChangePassword);

export default router;
