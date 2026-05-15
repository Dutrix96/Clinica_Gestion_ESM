import { pool } from '../database/mysql.js';
import { emitirActualizacionCitas } from '../helpers/socket.js';

export const citasGet = async (req, res) => {
  const condiciones = [];
  const params = [];

  let sql = `
    SELECT c.*, p.nombre paciente_nombre, p.apellidos paciente_apellidos,
           u.nombre medico_nombre
      FROM citas c
      JOIN pacientes p ON p.id = c.id_paciente
      JOIN usuarios u ON u.id = c.id_medico
  `;

  if (req.roles.includes('medico') && !req.roles.includes('administrador')) {
    condiciones.push('c.id_medico = ?');
    params.push(req.uid);
  }

  if (req.query.fecha) {
    condiciones.push('DATE(c.fecha_hora) = ?');
    params.push(req.query.fecha);
  }

  if (req.query.estado) {
    condiciones.push('c.estado = ?');
    params.push(req.query.estado);
  }

  if (condiciones.length) {
    sql += ` WHERE ${condiciones.join(' AND ')}`;
  }

  sql += ' ORDER BY c.fecha_hora DESC';
  const [citas] = await pool.query(sql, params);
  res.json(citas);
};

export const citasPost = async (req, res) => {
  const { id_paciente, id_medico, fecha_hora, motivo, duracion_minutos = 30 } = req.body;
  const [result] = await pool.query(
    `INSERT INTO citas (id_paciente, id_medico, fecha_hora, motivo, duracion_minutos, estado)
     VALUES (?, ?, ?, ?, ?, 'pendiente')`,
    [id_paciente, id_medico, fecha_hora, motivo, duracion_minutos]
  );

  await emitirActualizacionCitas();
  res.status(201).json({ id: result.insertId, id_paciente, id_medico, fecha_hora, motivo, duracion_minutos, estado: 'pendiente' });
};

export const citaEstadoPut = async (req, res) => {
  const { estado, duracion_minutos = null } = req.body;
  const estadosValidos = ['pendiente', 'en curso', 'finalizada', 'cancelada'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ msg: 'Estado no valido.' });
  }

  if (req.roles.includes('medico') && !['en curso', 'finalizada'].includes(estado)) {
    return res.status(403).json({ msg: 'El medico solo puede pasar citas a en curso o finalizada.' });
  }

  const params = duracion_minutos
    ? [estado, duracion_minutos, req.params.id]
    : [estado, req.params.id];
  const sql = duracion_minutos
    ? 'UPDATE citas SET estado = ?, duracion_minutos = ? WHERE id = ?'
    : 'UPDATE citas SET estado = ? WHERE id = ?';

  const [result] = await pool.query(sql, params);
  await emitirActualizacionCitas();

  res.json({ actualizado: result.affectedRows > 0 });
};

export const citasDelete = async (req, res) => {
  const [result] = await pool.query('DELETE FROM citas WHERE id = ?', [req.params.id]);
  await emitirActualizacionCitas();
  res.json({ eliminado: result.affectedRows > 0 });
};
