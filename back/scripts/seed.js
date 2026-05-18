import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import { env } from '../helpers/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const config = {
  mysql: {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    multipleStatements: true
  },
  mongoUrl: env.MONGO_URL,
  mongoDatabase: env.MONGO_DATABASE
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

const avisarBackend = async () => {
  try {
    await fetch(`http://127.0.0.1:${env.PORT}/api/sistema/seed-refrescado`, {
      method: 'POST'
    });
    console.log('Backend avisado para refrescar clientes por WebSocket.');
  } catch (error) {
    console.log('Backend no levantado; no se emiten eventos WebSocket del seed.');
  }
};

try {
  await seedSql();
  await seedMongo();
  await avisarBackend();
  console.log('Seeder completado.');
} catch (error) {
  console.error('Error ejecutando el seeder.');

  if (error.code === 'ECONNREFUSED') {
    console.error(`No se puede conectar a MySQL en ${config.mysql.host}:${config.mysql.port}. Arranca MySQL antes de ejecutar npm run seed.`);
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL ha rechazado el usuario o password. Revisa MYSQL_USER y MYSQL_PASSWORD en back/.env.');
  } else {
    console.error(error.message || error);
  }

  process.exit(1);
}
