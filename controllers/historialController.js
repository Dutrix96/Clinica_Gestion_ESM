import { pool } from '../database/mysql.js';
import Historial from '../models/historialMongoose.js';
import { emitirActualizacionCitas } from '../helpers/socket.js';

export const historialGet = async (req, res) => {
  const historial = await Historial.findOne({ id_paciente: Number(req.params.idPaciente) });

  if (!historial) {
    return res.status(404).json({ msg: 'Historial no encontrado.' });
  }

  res.json(historial);
};

export const entradaHistorialPost = async (req, res) => {
  const { id_paciente, id_cita, observaciones, diagnostico, tratamiento, archivos_adjuntos = [] } = req.body;
  const id_medico = req.uid;

  const [[cita]] = await pool.query(
    'SELECT id, id_medico FROM citas WHERE id = ? AND id_paciente = ?',
    [id_cita, id_paciente]
  );

  if (!cita || cita.id_medico !== id_medico) {
    return res.status(403).json({ msg: 'No puedes modificar el historial de esta cita.' });
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
