import { pool } from '../database/mysql.js';
import Historial from '../models/historialMongoose.js';
import { emitirActualizacionCitas } from '../helpers/socket.js';

export const historialGet = async (req, res) => {
  const idPaciente = Number(req.params.idPaciente);
  const [[paciente]] = await pool.query(
    'SELECT id, nombre, apellidos FROM pacientes WHERE id = ?',
    [idPaciente]
  );

  if (!paciente) {
    return res.status(404).json({ msg: 'Paciente no encontrado.' });
  }

  const historial = await Historial.findOne({ id_paciente: idPaciente }).lean();

  if (!historial) {
    return res.status(404).json({ msg: 'Historial no encontrado.' });
  }

  const idsMedicos = [...new Set(historial.entradas.map(entrada => entrada.id_medico))];
  let medicos = [];

  if (idsMedicos.length) {
    const placeholders = idsMedicos.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT id, nombre, especialidad FROM usuarios WHERE id IN (${placeholders})`,
      idsMedicos
    );
    medicos = rows;
  }

  const medicosPorId = new Map(medicos.map(medico => [medico.id, medico]));

  res.json({
    ...historial,
    paciente: paciente
      ? {
          ...paciente,
          nombre_completo: `${paciente.nombre} ${paciente.apellidos}`
        }
      : null,
    entradas: historial.entradas.map(entrada => {
      const medico = medicosPorId.get(entrada.id_medico);

      return {
        ...entrada,
        medico: medico
          ? {
              ...medico,
              nombre_completo: medico.nombre
            }
          : null
      };
    })
  });
};

export const entradaHistorialPost = async (req, res) => {
  const { id_paciente, id_cita, observaciones, diagnostico, tratamiento, archivos_adjuntos = [] } = req.body;
  const id_medico = req.uid;
  const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [id_paciente]);

  if (!paciente) {
    return res.status(404).json({ msg: 'Paciente no encontrado.' });
  }

  const [[cita]] = await pool.query(
    'SELECT id, id_medico, estado FROM citas WHERE id = ? AND id_paciente = ?',
    [id_cita, id_paciente]
  );

  if (!cita) {
    return res.status(404).json({ msg: 'Cita no encontrada.' });
  }

  if (cita.id_medico !== id_medico) {
    return res.status(403).json({ msg: 'No puedes modificar el historial de esta cita.' });
  }

  if (cita.estado !== 'en curso') {
    return res.status(400).json({ msg: 'Solo se puede finalizar una cita que esta en curso.' });
  }

  const entrada = { fecha: new Date(), id_medico, id_cita, observaciones, diagnostico, tratamiento, archivos_adjuntos };

  const historial = await Historial.findOneAndUpdate(
    { id_paciente },
    { $push: { entradas: entrada } },
    { new: true, upsert: true }
  );

  await pool.query('UPDATE citas SET estado = ? WHERE id = ?', ['finalizada', id_cita]);
  await emitirActualizacionCitas('cita_finalizada_con_historial');
  res.status(201).json(historial);
};

export const historialDelete = async (req, res) => {
  const idPaciente = Number(req.params.idPaciente);
  const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [idPaciente]);

  if (!paciente) {
    return res.status(404).json({ msg: 'Paciente no encontrado.' });
  }

  const historial = await Historial.findOneAndUpdate(
    { id_paciente: idPaciente },
    { $set: { entradas: [] } },
    { new: true, upsert: true }
  );

  res.json({
    borrado: true,
    historial
  });
};
