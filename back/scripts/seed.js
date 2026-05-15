import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const config = {
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true
  },
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
  mongoDatabase: process.env.MONGO_DATABASE || 'clinica_node'
};

const seedSql = async () => {
  const sqlPath = path.join(root, 'sql', 'clinica_node.sql');
  const sql = await fs.readFile(sqlPath, 'utf8');
  const connection = await mysql.createConnection(config.mysql);

  try {
    await connection.query(sql);
    console.log('MySQL cargado con datos de prueba.');
  } finally {
    await connection.end();
  }
};

const seedMongo = async () => {
  const jsonPath = path.join(root, 'mongo', 'historiales.json');
  const historiales = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  const client = new MongoClient(config.mongoUrl);

  try {
    await client.connect();
    const db = client.db(config.mongoDatabase);
    await db.collection('historiales').deleteMany({});
    if (historiales.length) {
      await db.collection('historiales').insertMany(historiales);
    }
    console.log('MongoDB cargado con historiales de prueba.');
  } finally {
    await client.close();
  }
};

try {
  await seedSql();
  await seedMongo();
  console.log('Seeder completado.');
} catch (error) {
  console.error('Error ejecutando el seeder:', error.message);
  process.exit(1);
}
