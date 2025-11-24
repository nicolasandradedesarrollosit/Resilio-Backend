import { validateUniqueLink } from '../../admin/model/uniqueLinksModel.js';
import { createBenefitModel } from '../../admin/model/pageBenefitsModel.js';
import { createBusiness } from '../../admin/model/pageBusinessModel.js';


export const validateToken = async (req, res) => {
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
        console.error('Error al validar token:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al validar token',
            error: error.message
        });
    }
};


export const uploadBenefit = async (req, res) => {
    try {
        const { token } = req.params;
        const benefitData = req.body;

        // Validar token
        const validation = await validateUniqueLink(token);

        if (!validation.valid) {
            return res.status(400).json({
                ok: false,
                message: validation.error
            });
        }

        const normalizedData = {
            name: benefitData.name,
            q_of_codes: benefitData.q_of_codes !== undefined && benefitData.q_of_codes !== null 
                ? parseInt(benefitData.q_of_codes, 10) 
                : 0,
            discount: benefitData.discount !== undefined && benefitData.discount !== null 
                ? parseInt(benefitData.discount, 10) 
                : 0,
            id_business_discount: parseInt(benefitData.id_business_discount, 10)
        };

        if (!normalizedData.name || !normalizedData.id_business_discount) {
            return res.status(400).json({
                ok: false,
                message: 'El nombre y el negocio son campos requeridos'
            });
        }

        const newBenefit = await createBenefitModel(normalizedData);

        res.status(201).json({
            ok: true,
            data: newBenefit,
            message: 'Beneficio subido exitosamente'
        });

    } catch (error) {
        console.error('Error al subir beneficio:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al subir beneficio',
            error: error.message
        });
    }
};

/**
 * Crear negocio mediante token (sin autenticación)
 * POST /api/partner/upload/:token/business
 */
export const uploadBusiness = async (req, res) => {
    try {
        const { token } = req.params;
        const businessData = req.body;

        // Validar token
        const validation = await validateUniqueLink(token);

        if (!validation.valid) {
            return res.status(400).json({
                ok: false,
                message: validation.error
            });
        }

        // Validaciones básicas
        if (!businessData.name) {
            return res.status(400).json({
                ok: false,
                message: 'El nombre del negocio es requerido'
            });
        }

        // Crear el negocio
        const newBusiness = await createBusinessModel(businessData);

        res.status(201).json({
            ok: true,
            data: newBusiness,
            message: 'Negocio creado exitosamente'
        });

    } catch (error) {
        console.error('Error al crear negocio:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al crear negocio',
            error: error.message
        });
    }
};
