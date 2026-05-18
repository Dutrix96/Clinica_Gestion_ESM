import { pool } from '../database/mysql.js';
import { emitirActualizacionCitas } from '../helpers/socket.js';
import { actualizarNoPresentados, ESTADOS_CITA } from '../helpers/citasEstado.js';

export const citasGet = async (req, res) => {
  await actualizarNoPresentados();

  const condiciones = [];
  const params = [];

  let sql = `
    SELECT c.*, p.nombre paciente_nombre, p.apellidos paciente_apellidos,
           u.nombre medico_nombre
      FROM citas c
      JOIN pacientes p ON p.id = c.id_paciente
      JOIN usuarios u ON u.id = c.id_medico
  `;

  condiciones.push("u.rol = 'medico'");

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
  const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [id_paciente]);

  if (!paciente) {
    return res.status(404).json({ msg: 'Paciente no encontrado.' });
  }

  const [[medico]] = await pool.query(
    `SELECT id
       FROM usuarios
      WHERE id = ?
        AND rol = 'medico'
        AND activo = 1`,
    [id_medico]
  );

  if (!medico) {
    return res.status(404).json({ msg: 'Medico no encontrado.' });
  }

  const [result] = await pool.query(
    `INSERT INTO citas (id_paciente, id_medico, fecha_hora, motivo, duracion_minutos, estado)
     VALUES (?, ?, ?, ?, ?, 'pendiente')`,
    [id_paciente, id_medico, fecha_hora, motivo, duracion_minutos]
  );

  await emitirActualizacionCitas('cita_creada');
  res.status(201).json({ id: result.insertId, id_paciente, id_medico, fecha_hora, motivo, duracion_minutos, estado: 'pendiente' });
};

export const citaEstadoPut = async (req, res) => {
  const { estado, duracion_minutos = null } = req.body;

  if (!ESTADOS_CITA.includes(estado)) {
    return res.status(400).json({ msg: 'Estado no valido.' });
  }

  if (req.roles.includes('medico') && estado === 'finalizada') {
    return res.status(400).json({ msg: 'Para finalizar una cita hay que guardar primero la entrada del historial.' });
  }

  if (req.roles.includes('medico') && estado !== 'en curso') {
    return res.status(403).json({ msg: 'El medico solo puede pasar citas a en curso desde este panel.' });
  }

  if (req.roles.includes('recepcionista') && estado !== 'cancelada') {
    return res.status(403).json({ msg: 'Recepcion solo puede cancelar citas.' });
  }

  const [[cita]] = await pool.query('SELECT id, id_medico FROM citas WHERE id = ?', [req.params.id]);

  if (!cita) {
    return res.status(404).json({ msg: 'Cita no encontrada.' });
  }

  if (req.roles.includes('medico') && cita.id_medico !== req.uid) {
    return res.status(403).json({ msg: 'No puedes modificar una cita que no tienes asignada.' });
  }

  const params = duracion_minutos
    ? [estado, duracion_minutos, req.params.id]
    : [estado, req.params.id];
  const sql = duracion_minutos
    ? 'UPDATE citas SET estado = ?, duracion_minutos = ? WHERE id = ?'
    : 'UPDATE citas SET estado = ? WHERE id = ?';

  const [result] = await pool.query(sql, params);
  await emitirActualizacionCitas(`cita_${estado.replaceAll(' ', '_')}`);

  res.json({ actualizado: result.affectedRows > 0 });
};

export const citasPut = async (req, res) => {
  const { id_paciente, id_medico, fecha_hora, motivo, duracion_minutos = 30 } = req.body;
  const [[cita]] = await pool.query('SELECT id, estado FROM citas WHERE id = ?', [req.params.id]);

  if (!cita) {
    return res.status(404).json({ msg: 'Cita no encontrada.' });
  }

  if (!['pendiente', 'cancelada'].includes(cita.estado)) {
    return res.status(400).json({ msg: 'Solo se pueden editar citas pendientes o canceladas.' });
  }

  const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [id_paciente]);

  if (!paciente) {
    return res.status(404).json({ msg: 'Paciente no encontrado.' });
  }

  const [[medico]] = await pool.query(
    `SELECT id
       FROM usuarios
      WHERE id = ?
        AND rol = 'medico'
        AND activo = 1`,
    [id_medico]
  );

  if (!medico) {
    return res.status(404).json({ msg: 'Medico no encontrado.' });
  }

  const [result] = await pool.query(
    `UPDATE citas
        SET id_paciente = ?,
            id_medico = ?,
            fecha_hora = ?,
            motivo = ?,
            duracion_minutos = ?
      WHERE id = ?
        AND estado IN ('pendiente', 'cancelada')`,
    [id_paciente, id_medico, fecha_hora, motivo, duracion_minutos, req.params.id]
  );

  await emitirActualizacionCitas('cita_editada');
  res.json({ actualizado: result.affectedRows > 0 });
};

export const citasDelete = async (req, res) => {
  const [[cita]] = await pool.query('SELECT id FROM citas WHERE id = ?', [req.params.id]);

  if (!cita) {
    return res.status(404).json({ msg: 'Cita no encontrada.' });
  }

  const [result] = await pool.query('DELETE FROM citas WHERE id = ?', [req.params.id]);
  await emitirActualizacionCitas('cita_eliminada');
  res.json({ eliminado: result.affectedRows > 0 });
};
