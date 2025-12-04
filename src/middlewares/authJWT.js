import {verifyAccess} from '../helpers/tokens.js';

// Middleware para verificar autenticación básica
export async function requireAuth(req, res, next){
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    try {
        const token = req.cookies?.access_token;
        
        if (!token) {
            return res.status(401).json({ 
                ok: false, 
                message: 'No autenticado' 
            });
        }
        
        const payload = verifyAccess(token);
        
        // Check if this is a business token
        if (payload.role === 'business') {
            const { findBusinessById } = await import('../client/model/businessModel.js');
            const business = await findBusinessById(payload.sub);
            
            if (!business) {
                return res.status(401).json({ 
                    ok: false, 
                    message: 'Negocio no encontrado' 
                });
            }
            
            if (!business.is_active) {
                return res.status(403).json({ 
                    ok: false, 
                    message: 'Tu cuenta ha sido suspendida. Contacta con soporte para más información.' 
                });
            }
            
            req.user = {
                id: parseInt(payload.sub, 10),
                tokenVersion: payload.version,
                role: 'business'
            };
            
            return next();
        }
        
        // Verificar que el usuario no esté baneado
        const { findOneById } = await import('../client/model/userModel.js');
        const user = await findOneById(payload.sub);
        
        if (!user) {
            return res.status(401).json({ 
                ok: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        if (user.is_banned) {
            return res.status(403).json({ 
                ok: false, 
                message: 'Tu cuenta ha sido suspendida. Contacta con soporte para más información.' 
            });
        }
        
        req.user = {
            id: parseInt(payload.sub, 10), // Asegurar que sea número
            tokenVersion: payload.version,
            role: user.role
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            ok: false, 
            message: 'Token inválido o expirado' 
        });
    }
}

// Middleware para verificar que el usuario sea administrador
export async function requireAdmin(req, res, next){
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    try {
        const token = req.cookies?.access_token;
        
        if (!token) {
            return res.status(401).json({ 
                ok: false, 
                message: 'No autenticado' 
            });
        }
        
        const payload = verifyAccess(token);
        
        const { findOneById } = await import('../client/model/userModel.js');
        const user = await findOneById(payload.sub);
        
        if (!user) {
            return res.status(401).json({ 
                ok: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        if (user.is_banned) {
            return res.status(403).json({ 
                ok: false, 
                message: 'Tu cuenta ha sido suspendida. Contacta con soporte para más información.' 
            });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ 
                ok: false, 
                message: 'No autorizado - Se requiere rol de administrador' 
            });
        }
        
        req.user = {
            id: parseInt(payload.sub, 10), // Asegurar que sea número
            tokenVersion: payload.version,
            role: user.role
        };
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            ok: false, 
            message: 'Token inválido o expirado' 
        });
    }
}

// Middleware opcional para verificar que el usuario acceda solo a sus propios recursos
export function requireOwnership(req, res, next) {
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    // Verificar que el usuario acceda a sus propios datos
    const requestedUserId = parseInt(req.params.userId || req.params.idUser || req.body.userId || req.body.idUser);
    const authenticatedUserId = req.user?.id;
    
    // Si no hay usuario autenticado, rechazar
    if (!authenticatedUserId) {
        return res.status(401).json({ 
            ok: false, 
            message: 'No autenticado' 
        });
    }
    
    // Si es admin, permitir acceso a cualquier recurso
    if (req.user?.role === 'admin') {
        return next();
    }
    
    // Verificar que el usuario solo acceda a sus propios recursos
    if (requestedUserId && requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ 
            ok: false, 
            message: 'No tienes permiso para acceder a este recurso' 
        });
    }
    
    next();
}