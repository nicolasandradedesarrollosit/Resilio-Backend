import {
    createUniqueLink
} from '../model/uniqueLinksModel.js';

/**
 * Crear nuevo enlace único
 * POST /api/admin/unique-links
 */
export const createLink = async (req, res) => {
    try {
        console.log('🔗 [UniLinks] Request recibido');
        console.log('👤 [UniLinks] User:', req.user);
        console.log('📦 [UniLinks] Body:', req.body);

        const { expirationHours } = req.body;
        const adminId = req.user.id;

        console.log('⏰ [UniLinks] Expiration hours:', expirationHours);
        console.log('👨‍💼 [UniLinks] Admin ID:', adminId);

        const link = await createUniqueLink(
            adminId,
            expirationHours || 2
        );

        console.log('✅ [UniLinks] Link creado en DB:', link);

        const uploadUrl = `${process.env.URL_FRONT}/partner/upload/${link.token}`;
        
        console.log('🔗 [UniLinks] Upload URL:', uploadUrl);

        const whatsappMessage = encodeURIComponent(
            `¡Hola! 👋\n\n` +
            `Te enviamos este enlace para que puedas subir beneficios a Resilio:\n\n` +
            `${uploadUrl}\n\n` +
            `Este enlace expira el: ${new Date(link.expires_at).toLocaleString('es-AR')}\n\n` +
            `¡Gracias por ser parte de Resilio! 🎉`
        );

        const responseData = {
            ok: true,
            data: {
                ...link,
                uploadUrl,
                whatsappLink: `https://wa.me/?text=${whatsappMessage}`
            },
            message: 'Enlace creado exitosamente'
        };

        console.log('📤 [UniLinks] Enviando respuesta:', responseData);

        res.status(201).json(responseData);

    } catch (error) {
        console.error('❌ [UniLinks] Error al crear enlace:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            ok: false,
            message: 'Error al crear enlace',
            error: error.message
        });
    }
};
