import {
    findBusinessByEmail,
    findBusinessById,
    getBusinessData
} from '../model/businessModel.js';
import { 
    comparePasswords
} from '../../helpers/hashing.js';
import {
    signJWT,
    signRefresh
} from '../../helpers/tokens.js';
import { validateFieldsBusinessLogIn } from '../../helpers/validateBusinessLoginFields.js';

export async function businessLogIn(req, res, next) {
    try {
        const { email, password } = req.body;
        console.log('🔍 Intentando login de negocio:', email);
        
        const isValid = validateFieldsBusinessLogIn(email, password);
        
        if (!isValid) {
            console.log('❌ Validación fallida');
            return res.status(400).json({ ok: false, message: 'Error de credenciales' });
        }
        
        const business = await findBusinessByEmail(email);
        console.log('📊 Negocio encontrado:', business ? 'SÍ' : 'NO');
        
        if (!business || !business.is_active) {
            console.log('❌ Negocio no existe o no está activo');
            return res.status(401).json({ ok: false, message: 'Error de credenciales' });
        }
        
        if (!business.password_hash) {
            console.log('❌ Negocio sin password_hash');
            return res.status(401).json({ ok: false, message: 'Esta cuenta no tiene configurada una contraseña' });
        }
        
        console.log('🔐 Comparando contraseñas...');
        const ok = await comparePasswords(password, business.password_hash);
        console.log('🔐 Resultado comparación:', ok ? '✅ CORRECTA' : '❌ INCORRECTA');
        
        if (!ok) {
            return res.status(401).json({ ok: false, message: 'Error de credenciales' });
        }
        
        if (!business.email_verified) {
            console.log('❌ Email no verificado');
            return res.status(403).json({ ok: false, message: 'Tienes que confirmar tu casilla de correo' });
        }

        console.log('✅ Login exitoso, generando tokens...');

        // Crear payload con role 'business'
        const businessPayload = {
            id: business.id,
            email: business.email,
            role: 'business',
            token_version: business.token_version || 0
        };

        const accessToken = signJWT(businessPayload);
        const refreshToken = signRefresh(businessPayload);
        const expiresAccess = 1000 * 60 * 15;
        const expiresRefresh = 1000 * 60 * 60 * 24 * 7;

        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            const accessCookie = `access_token=${accessToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${Math.floor(expiresAccess / 1000)}; Partitioned`;
            const refreshCookie = `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=None; Path=/api; Max-Age=${Math.floor(expiresRefresh / 1000)}; Partitioned`;
            
            res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
        } else {
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: expiresAccess
            });
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/api',
                maxAge: expiresRefresh
            });
        }

        console.log('🍪 Cookies configuradas');
        
        return res.json({
            ok: true,
            message: 'Inicio de sesión exitoso'
        });
    }
    catch (err) {
        next(err);
    }
}

export async function returnBusinessData(req, res, next) {
    try {
        console.log('📊 Obteniendo datos del negocio...');
        console.log('👤 req.user:', req.user);
        
        const businessId = req.user?.id;
        
        if (!businessId) {
            console.log('❌ No hay businessId en req.user');
            return res.status(401).json({ ok: false, message: 'No autenticado' });
        }
        
        console.log('🔍 Buscando negocio con ID:', businessId);
        const exists = await findBusinessById(businessId);
        
        if (!exists) {
            console.log('❌ Negocio no encontrado en DB');
            return res.status(404).json({ ok: false, message: 'Negocio no encontrado' });
        }

        console.log('✅ Negocio encontrado, obteniendo datos completos...');
        const dataBusiness = await getBusinessData(businessId);
        
        if (!dataBusiness) {
            console.log('❌ No se pudieron obtener los datos del negocio');
            return res.status(404).json({ ok: false, message: 'Datos no encontrados' });
        }
        
        // Agregar el rol al response
        const responseData = {
            ...dataBusiness,
            role: 'business'
        };
        
        console.log('✅ Datos del negocio obtenidos correctamente');
        return res.status(200).json({ ok: true, data: responseData });
    }
    catch (err) {
        console.log('❌ Error en returnBusinessData:', err);
        next(err);
    }
}
