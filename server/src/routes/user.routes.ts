import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router: Router = Router();

router.use(authMiddleware);

router.get('/', getUsers);
router.post('/', requireRole('superAdmin'), createUser);
router.put('/:id', requireRole('superAdmin'), updateUser);
router.delete('/:id', requireRole('superAdmin'), deleteUser);

export default router;
