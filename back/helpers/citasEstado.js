import { pool } from '../database/mysql.js';

export const ESTADOS_CITA = ['pendiente', 'en curso', 'finalizada', 'no presentado', 'cancelada'];

export const actualizarNoPresentados = async () => {
  await pool.query(
    `UPDATE citas
        SET estado = 'no presentado'
      WHERE estado = 'pendiente'
        AND fecha_hora < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`
  );
};
