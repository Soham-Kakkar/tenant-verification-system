import { Router } from 'express';
import { createRequest, verifyOtp } from '../controllers/landlord.controller';
import { uploadFields, validateTotalSize } from '../middlewares/upload.middleware';

const router: Router = Router();

router.post('/request', uploadFields, validateTotalSize, createRequest);
router.post('/verify-otp', verifyOtp);

export default router;
