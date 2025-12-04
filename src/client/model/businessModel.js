import { pool } from '../../config/db.js';


export async function findBusinessByEmail(email) {
    const { rows } = await pool.query(`
            SELECT * FROM business 
            WHERE email = $1
            LIMIT 1`,
        [email]
    );
    return rows[0] || null;
}

export async function findBusinessById(business_id) {
    const { rows } = await pool.query(`
            SELECT * FROM business 
            WHERE id = $1
            LIMIT 1`,
        [business_id]
    );
    return rows[0] || null;
}

export async function getBusinessData(business_id) {
    const { rows } = await pool.query(`
            SELECT 
                id,
                name,
                email,
                location,
                email_verified,
                is_active,
                created_at
            FROM business 
            WHERE id = $1
            LIMIT 1`,
        [business_id]
    );
    return rows[0] || null;
}
