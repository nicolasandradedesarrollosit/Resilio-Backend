import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';

const PORT = Number(process.env.PORT || 4000);

console.log('🚀 Iniciando servidor en puerto', PORT);

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
