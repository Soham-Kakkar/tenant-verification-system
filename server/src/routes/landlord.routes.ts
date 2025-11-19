import { Router } from 'express';
import { registerLandlord, completeRequest, verifyOtp, getImage } from '../controllers/landlord.controller';
import { uploadFields, validateTotalSize } from '../middlewares/upload.middleware';

const router: Router = Router();

router.post('/register', registerLandlord);
router.patch('/:verificationId/complete', uploadFields, validateTotalSize, completeRequest);
router.post('/verify-otp', verifyOtp);
router.get('/image/:verificationId/:type/:index', getImage);

export default router;
