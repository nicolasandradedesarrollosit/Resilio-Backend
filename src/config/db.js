import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const isLocal = process.env.URL_DB && (process.env.URL_DB.includes('localhost') || process.env.URL_DB.includes('127.0.0.1'));

export const pool = new Pool({
  connectionString: process.env.URL_DB,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});