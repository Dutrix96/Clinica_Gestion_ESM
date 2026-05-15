import { pool } from '../database/mysql.js';

let io = null;

export const setIO = socketServer => {
  io = socketServer;
};

export const emitirActualizacionCitas = async () => {
  if (!io) return;

  const [pendientes] = await pool.query(
    `SELECT COUNT(*) total
       FROM citas
      WHERE estado = 'pendiente'
        AND DATE(fecha_hora) = CURDATE()`
  );

  io.emit('citasActualizadas', {
    pendientesHoy: pendientes[0].total
  });
};
