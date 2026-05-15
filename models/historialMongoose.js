import mongoose from 'mongoose';

const EntradaHistorialSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  id_medico: { type: Number, required: true },
  id_cita: { type: Number },
  observaciones: { type: String, required: true },
  diagnostico: { type: String, required: true },
  tratamiento: { type: String, required: true },
  archivos_adjuntos: [{ type: String }]
}, { _id: false });

const HistorialSchema = new mongoose.Schema({
  id_paciente: { type: Number, required: true, unique: true },
  entradas: [EntradaHistorialSchema]
}, { versionKey: false });

export default mongoose.model('Historial', HistorialSchema);
