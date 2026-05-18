import { pool } from '../database/mysql.js';
import { actualizarNoPresentados } from '../helpers/citasEstado.js';

export const metricasGet = async (req, res) => {
  await actualizarNoPresentados();

  const [[usuarios]] = await pool.query('SELECT COUNT(*) total FROM usuarios');
  const [[pacientes]] = await pool.query('SELECT COUNT(*) total FROM pacientes');
  const [[citas]] = await pool.query('SELECT COUNT(*) total FROM citas');
  const condiciones = ["c.estado = 'pendiente'", 'DATE(c.fecha_hora) = CURDATE()', "u.rol = 'medico'"];
  const params = [];

  if (req.roles.includes('medico') && !req.roles.includes('administrador')) {
    condiciones.push('c.id_medico = ?');
    params.push(req.uid);
  }

  const [[pendientesHoy]] = await pool.query(
    `SELECT COUNT(*) total
       FROM citas c
       JOIN usuarios u ON u.id = c.id_medico
      WHERE ${condiciones.join(' AND ')}`,
    params
  );

  res.json({
    usuarios: usuarios.total,
    pacientes: pacientes.total,
    citas: citas.total,
    pendientesHoy: pendientesHoy.total
  });
};
