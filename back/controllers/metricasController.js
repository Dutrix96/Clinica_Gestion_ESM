import { pool } from '../database/mysql.js';

export const metricasGet = async (req, res) => {
  const [[usuarios]] = await pool.query('SELECT COUNT(*) total FROM usuarios');
  const [[pacientes]] = await pool.query('SELECT COUNT(*) total FROM pacientes');
  const [[citas]] = await pool.query('SELECT COUNT(*) total FROM citas');
  const [[pendientesHoy]] = await pool.query(
    `SELECT COUNT(*) total
       FROM citas
      WHERE estado = 'pendiente'
        AND DATE(fecha_hora) = CURDATE()`
  );

  res.json({
    usuarios: usuarios.total,
    pacientes: pacientes.total,
    citas: citas.total,
    pendientesHoy: pendientesHoy.total
  });
};
