import { pool } from '../database/mysql.js';
import Historial from '../models/historialMongoose.js';

const nombres = ['Ana', 'Lucas', 'Marta', 'Javier', 'Sofia', 'Pablo', 'Irene', 'Diego'];
const apellidos = ['Garcia', 'Lopez', 'Martinez', 'Sanchez', 'Perez', 'Romero', 'Torres', 'Ruiz'];

export const pacientesGet = async (req, res) => {
  const [pacientes] = await pool.query('SELECT * FROM pacientes ORDER BY id DESC');
  res.json(pacientes);
};

export const pacienteGet = async (req, res) => {
  const [[paciente]] = await pool.query('SELECT * FROM pacientes WHERE id = ?', [req.params.id]);

  if (!paciente) {
    return res.status(404).json({ msg: 'Paciente no encontrado.' });
  }

  res.json(paciente);
};

export const pacientesPost = async (req, res) => {
  const { nombre, apellidos, dni, telefono, email, fecha_nacimiento } = req.body;
  const [result] = await pool.query(
    `INSERT INTO pacientes (nombre, apellidos, dni, telefono, email, fecha_nacimiento)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellidos, dni, telefono, email, fecha_nacimiento]
  );

  await Historial.create({ id_paciente: result.insertId, entradas: [] });
  res.status(201).json({ id: result.insertId, nombre, apellidos, dni, telefono, email, fecha_nacimiento });
};

export const pacientesDelete = async (req, res) => {
  await pool.query('DELETE FROM citas WHERE id_paciente = ?', [req.params.id]);
  const [result] = await pool.query('DELETE FROM pacientes WHERE id = ?', [req.params.id]);
  await Historial.deleteOne({ id_paciente: Number(req.params.id) });

  res.json({ eliminado: result.affectedRows > 0 });
};

export const generarPacientes = async (req, res) => {
  const cantidad = Number(req.body.cantidad || 0);

  if (!cantidad || cantidad < 1) {
    return res.status(400).json({ msg: 'Debes indicar una cantidad mayor que 0.' });
  }

  const creados = [];

  for (let i = 0; i < cantidad; i++) {
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellidosPaciente = `${apellidos[Math.floor(Math.random() * apellidos.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;
    const dni = `${Math.floor(10000000 + Math.random() * 89999999)}${'TRWAGMYFPDXBNJZSQVHLCKE'[i % 23]}`;
    const telefono = `6${Math.floor(10000000 + Math.random() * 89999999)}`;
    const email = `${nombre.toLowerCase()}.${Date.now()}${i}@clinica.test`;
    const fecha_nacimiento = `${1950 + Math.floor(Math.random() * 55)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO pacientes (nombre, apellidos, dni, telefono, email, fecha_nacimiento)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, apellidosPaciente, dni, telefono, email, fecha_nacimiento]
    );

    await Historial.create({ id_paciente: result.insertId, entradas: [] });
    creados.push({ id: result.insertId, nombre, apellidos: apellidosPaciente, dni });
  }

  res.status(201).json({ creados: creados.length, pacientes: creados });
};
