import { validateUniqueLink } from '../../admin/model/uniqueLinksModel.js';
import { pool } from '../../config/db.js';
import { hashPassword } from '../../helpers/hashing.js';

export const validateBusinessToken = async (req, res) => {
    try {
        const { token } = req.params;

        const validation = await validateUniqueLink(token);

        if (!validation.valid) {
            return res.status(400).json({
                ok: false,
                message: validation.error,
                expiresAt: validation.expiresAt
            });
        }

        res.json({
            ok: true,
            data: validation.data
        });

    } catch (error) {
        console.error('Error al validar token de negocio:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al validar token',
            error: error.message
        });
    }
};

export const registerBusinessViaUnilink = async (req, res) => {
    try {
        const { token } = req.params;
        const businessData = req.body;

        console.log('🏢 [Business Unilink] Request recibido');
        console.log('📦 [Business Unilink] Body:', businessData);

        // Validar token
        const validation = await validateUniqueLink(token);

        if (!validation.valid) {
            return res.status(400).json({
                ok: false,
                message: validation.error
            });
        }

        if (!businessData.name || !businessData.email || !businessData.password) {
            return res.status(400).json({
                ok: false,
                message: 'Nombre, email y contraseña son campos requeridos'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(businessData.email)) {
            return res.status(400).json({
                ok: false,
                message: 'Formato de email inválido'
            });
        }

        const { rows: existingBusiness } = await pool.query(
            'SELECT id FROM business WHERE email = $1',
            [businessData.email.toLowerCase()]
        );

        if (existingBusiness.length > 0) {
            return res.status(400).json({
                ok: false,
                message: 'Este email ya está registrado'
            });
        }

        const password_hash = await hashPassword(businessData.password);

        const { rows } = await pool.query(
            `INSERT INTO business 
            (name, location, url_image_business, email, password_hash, email_verified, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, location, url_image_business, email, email_verified, is_active, created_at`,
            [
                businessData.name,
                businessData.location || null,
                businessData.url_image_business || null,
                businessData.email.toLowerCase(),
                password_hash,
                false, 
                true   
            ]
        );

        const newBusiness = rows[0];

        console.log('✅ [Business Unilink] Negocio creado:', newBusiness.id);

        res.status(201).json({
            ok: true,
            data: newBusiness,
            message: 'Negocio registrado exitosamente. Pronto recibirá un email de verificación.'
        });

    } catch (error) {
        console.error('❌ [Business Unilink] Error al registrar negocio:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            ok: false,
            message: 'Error al registrar negocio',
            error: error.message
        });
    }
};


export const checkBusinessEmail = async (req, res) => {
    try {
        const { token, email } = req.params;

        const validation = await validateUniqueLink(token);

        if (!validation.valid) {
            return res.status(400).json({
                ok: false,
                message: validation.error
            });
        }

        const { rows } = await pool.query(
            'SELECT id FROM business WHERE email = $1',
            [email.toLowerCase()]
        );

        res.json({
            ok: true,
            exists: rows.length > 0
        });

    } catch (error) {
        console.error('Error al verificar email de negocio:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al verificar email',
            error: error.message
        });
    }
};
