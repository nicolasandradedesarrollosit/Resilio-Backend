import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoute from './client/route/userRoute.js';
import passwordRoute from './client/route/recoverPasswordRoute.js';
import refreshRoute from './client/route/refreshRoute.js';
import googleRoute from './client/route/googleOauthRoute.js';
import bannerRoute from './client/route/bannerRoute.js';
import eventsRoute from './client/route/eventsRoutes.js';
import partnersRoute from './client/route/partnersRoute.js';
import benefitsRoute from './client/route/myBenefitsRoute.js';
import pageUserAdminRoute from './admin/route/pageUserRoute.js';
import pageEventsRoute from './admin/route/pageEventsRoute.js';
import pageBenefitRoute from './admin/route/pageBenefitRoute.js';
import pageBusinessRoute from './admin/route/pageBusinessRoute.js';
import uniqueLinksRoute from './admin/route/uniqueLinksRoute.js';
import partnerUploadRoute from './client/route/partnerUploadRoute.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// TRUST PROXY - Necesario para Render y otros servicios en la nube
// ============================================
// Esto permite que Express confíe en el header X-Forwarded-For
// que es usado por proxies inversos como Render, Heroku, etc.
app.set('trust proxy', true);

const allowedOrigins = [
    'https://nicolasandradedesarrollosit.github.io',
    process.env.URL_FRONT 
].filter(Boolean);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.URL_FRONT]
        }
    }
}));

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true, 
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400 
}));

app.use(cookieParser()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// RATE LIMITING - Protección contra ataques de fuerza bruta
// ============================================

// Rate limiter general para todas las rutas API
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP en 15 minutos
    message: {
        ok: false,
        message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.'
    },
    standardHeaders: true, // Retorna info de rate limit en los headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} excedió el límite general en ${req.path}`);
        res.status(429).json({
            ok: false,
            message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.'
        });
    }
});

// Rate limiter estricto para autenticación (login, register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos en 15 minutos
    message: {
        ok: false,
        message: 'Demasiados intentos de autenticación. Por favor, intenta más tarde.'
    },
    skipSuccessfulRequests: true, // No cuenta requests exitosos
    handler: (req, res) => {
        console.warn(`[SECURITY] IP ${req.ip} excedió límite de autenticación en ${req.path}`);
        res.status(429).json({
            ok: false,
            message: 'Demasiados intentos de autenticación. Por favor, espera 15 minutos e intenta nuevamente.'
        });
    }
});

// Rate limiter para recuperación de contraseña
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 intentos por hora
    message: {
        ok: false,
        message: 'Demasiados intentos de recuperación de contraseña. Por favor, intenta más tarde.'
    },
    handler: (req, res) => {
        console.warn(`[SECURITY] IP ${req.ip} excedió límite de recuperación de contraseña`);
        res.status(429).json({
            ok: false,
            message: 'Demasiados intentos de recuperación de contraseña. Por favor, espera 1 hora.'
        });
    }
});

// Rate limiter para subida de archivos
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // máximo 20 uploads en 15 minutos
    message: {
        ok: false,
        message: 'Demasiadas subidas de archivos. Por favor, intenta más tarde.'
    },
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} excedió límite de uploads`);
        res.status(429).json({
            ok: false,
            message: 'Demasiadas subidas de archivos. Por favor, espera unos minutos.'
        });
    }
});

// Aplicar rate limiter general a todas las rutas API
app.use('/api/', generalLimiter);

// Aplicar rate limiters específicos
app.use('/api/log-in', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/auth/google', authLimiter); // Google OAuth también necesita límite
app.use('/api/verify-email', authLimiter); // Verificación de email
app.use('/api/refresh', authLimiter); // Refresh token
app.use('/api/reset-password', passwordResetLimiter);
app.use('/api/recover-password', passwordResetLimiter);
app.use('/api/forgot-password', passwordResetLimiter);
app.use('/api/admin/events/upload-image', uploadLimiter);
app.use('/api/admin/business/upload-image', uploadLimiter);
app.use('/api/admin/benefits', uploadLimiter); // Beneficios admin pueden tener imágenes
app.use('/api/admin/business', uploadLimiter); // Negocios admin pueden tener imágenes

// ============================================
// FIN RATE LIMITING
// ============================================

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
    next();
});

app.get('/health-check', async (_req, res) => {
    res.status(200).json({ ok: true, message: 'API corriendo en Render 🚀' });
});

app.get('/api/health', async (_req, res) => {
    res.status(200).json({ 
        ok: true, 
        status: 'online',
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

app.use('/api', userRoute);
app.use('/api', passwordRoute);
app.use('/api', refreshRoute);
app.use('/api', googleRoute);
app.use('/api', bannerRoute);
app.use('/api', eventsRoute);
app.use('/api', partnersRoute);
app.use('/api' , benefitsRoute);
app.use('/api/admin', uniqueLinksRoute);
app.use('/api', partnerUploadRoute); // Rutas públicas sin autenticación
app.use('/api', pageUserAdminRoute);
app.use('/api', pageEventsRoute);
app.use('/api', pageBenefitRoute);
app.use('/api', pageBusinessRoute);

app.use((err, _req, res, next) => {
  if (err && err.message && err.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({ 
      error: err.message 
    });
  }
  next(err);
});

// Middleware de logging de seguridad
app.use((err, req, res, next) => {
  // Log de intentos de autenticación fallidos
  if (err.status === 401 || err.status === 403) {
    console.warn(`[SECURITY ALERT] ${new Date().toISOString()} - Unauthorized access attempt:`);
    console.warn(`  IP: ${req.ip}`);
    console.warn(`  Path: ${req.path}`);
    console.warn(`  Method: ${req.method}`);
    console.warn(`  User-Agent: ${req.get('user-agent')}`);
  }
  
  // Log de errores sospechosos
  if (err.message && (
    err.message.includes('SQL') || 
    err.message.includes('injection') ||
    err.message.includes('..') ||
    err.message.includes('script')
  )) {
    console.error(`[SECURITY CRITICAL] ${new Date().toISOString()} - Potential attack detected:`);
    console.error(`  IP: ${req.ip}`);
    console.error(`  Path: ${req.path}`);
    console.error(`  Error: ${err.message}`);
  }
  
  next(err);
});

app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  console.error('Error interno del servidor:', err);
  res.status(500).json({ 
    ok: false, 
    message: 'Error interno del servidor' 
  });
});

export default app;