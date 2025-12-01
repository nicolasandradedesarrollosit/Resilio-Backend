import express from 'express';
import { requireAdmin } from '../../middlewares/authJWT.js';
import {
    createLink,
    createBusinessLink
} from '../controller/uniqueLinksController.js';

const router = express.Router();

// Rutas protegidas para admins
router.post('/unique-links', requireAdmin, createLink); // Para beneficios
router.post('/unique-links/business', requireAdmin, createBusinessLink); // Para negocios

export default router;
