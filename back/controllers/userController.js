import bcrypt from 'bcryptjs';
import { pool } from '../database/mysql.js';

export const usuariosGet = async (req, res) => {
  const [usuarios] = await pool.query(
    'SELECT id, nombre, email, rol, especialidad, activo, created_at FROM usuarios ORDER BY id'
  );
  res.json(usuarios);
};

export const usuariosPost = async (req, res) => {
  const { nombre, email, password, rol, especialidad = null } = req.body;

  if (!['administrador', 'medico', 'recepcionista'].includes(rol)) {
    return res.status(400).json({ msg: 'Rol no valido.' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, especialidad)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, email, password_hash, rol, especialidad]
  );

  res.status(201).json({ id: result.insertId, nombre, email, rol, especialidad });
};
