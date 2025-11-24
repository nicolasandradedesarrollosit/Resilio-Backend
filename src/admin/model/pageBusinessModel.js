import { pool } from '../../config/db.js';

export async function findOneById (businessId) {
    const { rows } = await pool.query(
        `
        SELECT * FROM business
        WHERE id = $1
        `,
        [businessId]
    );
    return rows.length > 0;
}

export async function getBusiness (limit, offset) {
    try {
        const { rows } = await pool.query(
            `
            SELECT * FROM business
            ORDER BY id DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );
        return rows;
    } catch (err) {
        throw err;
    }
}

export async function getAllBusinessModel () {
    try {
        const { rows } = await pool.query(
            `
            SELECT * FROM business
            ORDER BY name ASC
            `
        );
        return rows;
    } catch (err) {
        throw err;
    }
}

export async function createBusiness (businessData) {
    const { name, location, url_image_business } = businessData;
    const { rows } = await pool.query(
        `
        INSERT INTO business
        (name, location, url_image_business)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, location, url_image_business]
    );
    return rows[0];
}

export async function updateBusiness (businessId, fieldsToUpdate) {
    const allowedFields = ['name', 'location', 'url_image_business'];
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(fieldsToUpdate)) {
        if (allowedFields.includes(key)) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (fields.length === 0) {
        const { rows } = await pool.query(`SELECT * FROM business WHERE id = $1`, [businessId]);
        return rows[0] || null;
    }

    const query = `UPDATE business
        SET ${fields.join(',\n        ')}
        WHERE id = $${paramIndex}
        RETURNING *`;

    values.push(businessId);

    const { rows } = await pool.query(query, values);
    return rows[0] || null;
}

export async function deleteBusiness (businessId) {
    const { rows } = await pool.query(
        `
        DELETE FROM business
        WHERE id = $1
        RETURNING *
        `,
        [businessId]
    );
    return rows[0] || null;
}