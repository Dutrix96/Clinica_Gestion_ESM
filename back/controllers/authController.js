import bcrypt from 'bcryptjs';
import { pool } from '../database/mysql.js';
import { generarJWT_Roles } from '../helpers/generate_jwt.js';
import jwt from 'jsonwebtoken';
import { env } from '../helpers/env.js';

export const register = async (req, res) => {
  const { nombre, email, password, rol = 'recepcionista', especialidad = null } = req.body;
  const rolesValidos = ['administrador', 'medico', 'recepcionista'];

  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ msg: 'Rol no valido.' });
  }

  try {
    const [[existe]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);

    if (existe) {
      return res.status(400).json({ msg: 'Ya existe un usuario con ese email.' });
    }

    const [[contador]] = await pool.query('SELECT COUNT(*) total FROM usuarios');

    if (contador.total > 0) {
      const token = req.header('x-token');

      if (!token) {
        return res.status(401).json({ msg: 'Solo el administrador puede registrar mas usuarios.' });
      }

      let roles = [];

      try {
        const payload = jwt.verify(token, env.SECRETORPRIVATEKEY);
        roles = payload.roles || [];
      } catch (error) {
        return res.status(401).json({ msg: 'Token no valido.' });
      }

      if (!roles.includes('administrador')) {
        return res.status(403).json({ msg: 'No tienes permisos para registrar usuarios.' });
      }
    }

    const rolFinal = contador.total === 0 ? 'administrador' : rol;
    const password_hash = bcrypt.hashSync(password, 10);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, especialidad)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, password_hash, rolFinal, especialidad]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      email,
      rol: rolFinal,
      especialidad
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [[usuario]] = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, especialidad FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
      return res.status(400).json({ msg: 'Email o password incorrectos.' });
    }

    const token = generarJWT_Roles(usuario.id, [usuario.rol]);
    delete usuario.password_hash;

    res.status(200).json({ usuario, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor.' });
  }
};
