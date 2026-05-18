import bcrypt from 'bcryptjs';
import { pool } from '../database/mysql.js';

export const usuariosGet = async (req, res) => {
  const [usuarios] = await pool.query(
    'SELECT id, nombre, email, rol, especialidad, activo, created_at FROM usuarios ORDER BY id'
  );
  res.json(usuarios);
};

export const medicosGet = async (req, res) => {
  const [medicos] = await pool.query(
    `SELECT id, nombre, email, especialidad
       FROM usuarios
      WHERE rol = 'medico'
        AND activo = 1
      ORDER BY nombre`
  );
  res.json(medicos);
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

export const usuariosPut = async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, email, password = '', rol, especialidad = null, activo = 1 } = req.body;
  const esUsuarioActual = id === req.uid;
  const [[usuarioExistente]] = await pool.query('SELECT id, rol FROM usuarios WHERE id = ?', [id]);

  if (!usuarioExistente) {
    return res.status(404).json({ msg: 'Usuario no encontrado.' });
  }

  if (!['administrador', 'medico', 'recepcionista'].includes(rol)) {
    return res.status(400).json({ msg: 'Rol no valido.' });
  }

  const rolFinal = esUsuarioActual ? usuarioExistente.rol : rol;
  const activoFinal = esUsuarioActual ? 1 : Number(activo);

  if (password) {
    const password_hash = bcrypt.hashSync(password, 10);
    await pool.query(
      `UPDATE usuarios
          SET nombre = ?, email = ?, password_hash = ?, rol = ?, especialidad = ?, activo = ?
        WHERE id = ?`,
      [nombre, email, password_hash, rolFinal, especialidad, activoFinal, id]
    );
  } else {
    await pool.query(
      `UPDATE usuarios
          SET nombre = ?, email = ?, rol = ?, especialidad = ?, activo = ?
        WHERE id = ?`,
      [nombre, email, rolFinal, especialidad, activoFinal, id]
    );
  }

  res.json({ id, nombre, email, rol: rolFinal, especialidad, activo: activoFinal });
};

export const usuariosDelete = async (req, res) => {
  const id = Number(req.params.id);

  if (id === req.uid) {
    return res.status(400).json({ msg: 'No puedes borrarte a ti mismo.' });
  }

  const [[usuario]] = await pool.query('SELECT id FROM usuarios WHERE id = ?', [id]);

  if (!usuario) {
    return res.status(404).json({ msg: 'Usuario no encontrado.' });
  }

  const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  res.json({ eliminado: result.affectedRows > 0 });
};
