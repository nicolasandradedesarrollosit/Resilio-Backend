import {
    createUniqueLink
} from '../model/uniqueLinksModel.js';

/**
 * Crear nuevo enlace único
 * POST /api/admin/unique-links
 */
export const createLink = async (req, res) => {
    try {
        const { expirationHours } = req.body;
        const adminId = req.user.id;

        const link = await createUniqueLink(
            adminId,
            expirationHours || 2
        );

        const uploadUrl = `${process.env.URL_FRONT}/partner/upload/${link.token}`;
        
        const whatsappMessage = encodeURIComponent(
            `¡Hola! 👋\n\n` +
            `Te enviamos este enlace para que puedas subir beneficios a Resilio:\n\n` +
            `${uploadUrl}\n\n` +
            `Este enlace expira el: ${new Date(link.expires_at).toLocaleString('es-AR')}\n\n` +
            `¡Gracias por ser parte de Resilio! 🎉`
        );

        res.status(201).json({
            ok: true,
            data: {
                ...link,
                uploadUrl,
                whatsappLink: `https://wa.me/?text=${whatsappMessage}`
            },
            message: 'Enlace creado exitosamente'
        });

    } catch (error) {
        console.error('Error al crear enlace:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al crear enlace',
            error: error.message
        });
    }
};
