import { pool } from '../src/config/db.js';
import { hashPassword } from '../src/helpers/hashing.js';

async function createTestBusiness() {
    try {
        const email = 'nicolas@gmail.com';
        const password = '12345678'; // Contraseña de prueba
        const name = 'Negocio Test';
        
        // Hash de la contraseña
        const passwordHash = await hashPassword(password);
        
        // Verificar si ya existe
        const { rows: existing } = await pool.query(
            'SELECT id FROM business WHERE email = $1',
            [email]
        );
        
        if (existing.length > 0) {
            // Actualizar el existente
            await pool.query(`
                UPDATE business 
                SET password_hash = $1, 
                    email_verified = true, 
                    is_active = true
                WHERE email = $2
            `, [passwordHash, email]);
            
            console.log('✅ Negocio actualizado exitosamente');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Contraseña: ${password}`);
        } else {
            // Crear nuevo
            const { rows } = await pool.query(`
                INSERT INTO business (
                    name, 
                    email, 
                    password_hash, 
                    email_verified, 
                    is_active,
                    location
                )
                VALUES ($1, $2, $3, true, true, 'Buenos Aires, Argentina')
                RETURNING id, name, email
            `, [name, email, passwordHash]);
            
            console.log('✅ Negocio creado exitosamente');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Contraseña: ${password}`);
            console.log(`ID: ${rows[0].id}`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestBusiness();
