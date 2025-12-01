import express from 'express';
import {
    validateBusinessToken,
    registerBusinessViaUnilink,
    checkBusinessEmail
} from '../controller/businessUnilinkController.js';

const router = express.Router();

// Rutas PÚBLICAS para unilinks de negocios (sin autenticación)
router.get('/business/upload/:token/validate', validateBusinessToken);
router.post('/business/upload/:token/register', registerBusinessViaUnilink);
router.get('/business/upload/:token/check-email/:email', checkBusinessEmail);

export default router;
