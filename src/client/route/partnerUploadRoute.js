import express from 'express';
import {
    validateToken,
    uploadBenefit,
    uploadBusiness
} from '../controller/partnerUploadController.js';

const router = express.Router();

// Rutas PÚBLICAS (sin autenticación) - No pasan por requireAuth
router.get('/partner/upload/:token/validate', validateToken);
router.post('/partner/upload/:token/benefit', uploadBenefit);
router.post('/partner/upload/:token/business', uploadBusiness);

export default router;
