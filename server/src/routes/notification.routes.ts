import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);

export default router;
