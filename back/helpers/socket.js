import { pool } from '../database/mysql.js';
import { actualizarNoPresentados } from './citasEstado.js';

let io = null;

export const setIO = socketServer => {
  io = socketServer;
};

export const emitirActualizacionCitas = async (accion = 'actualizacion') => {
  if (!io) return;

  await actualizarNoPresentados();

  const [pendientes] = await pool.query(
    `SELECT COUNT(*) total
       FROM citas c
       JOIN usuarios u ON u.id = c.id_medico
      WHERE c.estado = 'pendiente'
        AND DATE(c.fecha_hora) = CURDATE()
        AND u.rol = 'medico'`
  );

  io.emit('citasActualizadas', {
    accion,
    pendientesHoy: pendientes[0].total
  });
};

export const emitirActualizacionPacientes = (accion = 'pacientes_actualizados') => {
  if (!io) return;

  io.emit('pacientesActualizados', { accion });
};

export const emitirRefrescoGeneral = async (accion = 'seed_refrescado') => {
  await emitirActualizacionCitas(accion);
  emitirActualizacionPacientes(accion);
};
