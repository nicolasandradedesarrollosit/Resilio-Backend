import { pool } from '../../config/db.js';
import crypto from 'crypto';

/**
 * Generar token único seguro
 */
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Crear token único para carga de beneficios
 * @param {number} adminId - ID del admin que crea el token
 * @param {number} expirationHours - Horas hasta expiración (default: 2)
 */
export const createUniqueLink = async (adminId, expirationHours = 2) => {
    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const { rows } = await pool.query(
        `INSERT INTO unique_links (token, expires_at)
         VALUES ($1, $2)
         RETURNING *`,
        [token, expiresAt]
    );

    return rows[0];
};

/**
 * Validar token único
 * @param {string} token - Token a validar
 */
export const validateUniqueLink = async (token) => {
    const { rows } = await pool.query(
        `SELECT * FROM unique_links 
         WHERE token = $1`,
        [token]
    );

    if (rows.length === 0) {
        return { valid: false, error: 'Token no encontrado' };
    }

    const link = rows[0];

    // Verificar si expiró
    if (new Date(link.expires_at) < new Date()) {
        return { 
            valid: false, 
            error: 'Este enlace ha expirado',
            expiresAt: link.expires_at 
        };
    }

    return { valid: true, data: link };
};


