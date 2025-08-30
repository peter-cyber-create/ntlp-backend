import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  database: 'conf',
  user: 'root',
  password: 'toor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});