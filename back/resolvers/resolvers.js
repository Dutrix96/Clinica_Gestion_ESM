import { pool } from '../database/mysql.js';
import Historial from '../models/historialMongoose.js';
import { actualizarNoPresentados } from '../helpers/citasEstado.js';

const comprobarRol = (context, roles) => {
  if (!context.user || !roles.some(rol => context.user.roles.includes(rol))) {
    throw new Error('No tienes permisos para realizar esta consulta.');
  }
};

const normalizarCita = cita => ({
  ...cita,
  fecha_hora: cita.fecha_hora instanceof Date ? cita.fecha_hora.toISOString() : String(cita.fecha_hora)
});

const resolvers = {
  Query: {
    citasFinalizadasPorMedico: async (_, args, context) => {
      comprobarRol(context, ['administrador']);
      await actualizarNoPresentados();
      const [rows] = await pool.query(`
        SELECT u.id id_medico, u.nombre medico, COUNT(c.id) total
          FROM usuarios u
          LEFT JOIN citas c ON c.id_medico = u.id AND c.estado = 'finalizada'
         WHERE u.rol = 'medico'
         GROUP BY u.id, u.nombre
         ORDER BY total DESC
      `);
      return rows;
    },
    citasPendientesHoy: async (_, args, context) => {
      comprobarRol(context, ['administrador', 'recepcionista', 'medico']);
      await actualizarNoPresentados();
      let sql = `
        SELECT c.id, c.id_paciente, CONCAT(p.nombre, ' ', p.apellidos) paciente,
               c.id_medico, u.nombre medico, c.fecha_hora, c.motivo, c.estado,
               c.duracion_minutos
          FROM citas c
          JOIN pacientes p ON p.id = c.id_paciente
          JOIN usuarios u ON u.id = c.id_medico
         WHERE c.estado = 'pendiente'
           AND DATE(c.fecha_hora) = CURDATE()
      `;
      const params = [];

      if (context.user.roles.includes('medico')) {
        sql += ' AND c.id_medico = ?';
        params.push(context.user.uid);
      }

      sql += ' ORDER BY c.fecha_hora';
      const [rows] = await pool.query(sql, params);
      return rows.map(normalizarCita);
    },
    duracionPromedioPorMedico: async (_, args, context) => {
      comprobarRol(context, ['administrador']);
      await actualizarNoPresentados();
      const [rows] = await pool.query(`
        SELECT u.id id_medico, u.nombre medico, AVG(c.duracion_minutos) promedio_minutos
          FROM usuarios u
          JOIN citas c ON c.id_medico = u.id
         WHERE u.rol = 'medico'
           AND c.estado = 'finalizada'
         GROUP BY u.id, u.nombre
      `);
      return rows;
    },
    historialPaciente: async (_, { id_paciente }, context) => {
      comprobarRol(context, ['administrador', 'medico']);
      const historial = await Historial.findOne({ id_paciente }).lean();

      if (!historial) {
        return { id_paciente, entradas: [] };
      }

      return {
        id_paciente: historial.id_paciente,
        entradas: historial.entradas.map(entrada => ({
          ...entrada,
          fecha: entrada.fecha instanceof Date ? entrada.fecha.toISOString() : String(entrada.fecha)
        }))
      };
    }
  }
};

export default resolvers;
