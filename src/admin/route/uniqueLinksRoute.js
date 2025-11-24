import express from 'express';
import { requireAdmin } from '../../middlewares/authJWT.js';
import {
    createLink
} from '../controller/uniqueLinksController.js';

const router = express.Router();

// Ruta protegida para admins - Solo crear enlaces
router.post('/unique-links', requireAdmin, createLink);

export default router;
