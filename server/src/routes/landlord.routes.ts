import { Router } from 'express';
import { createRequest, verifyOtp } from '../controllers/landlord.controller';

const router: Router = Router();

router.post('/request', createRequest);
router.post('/verify-otp', verifyOtp);

export default router;
