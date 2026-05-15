import { gql } from 'graphql-tag';

const typeDefs = gql`
  type MedicoCitasFinalizadas {
    id_medico: Int
    medico: String
    total: Int
  }

  type Cita {
    id: Int
    id_paciente: Int
    paciente: String
    id_medico: Int
    medico: String
    fecha_hora: String
    motivo: String
    estado: String
    duracion_minutos: Int
  }

  type DuracionPromedio {
    id_medico: Int
    medico: String
    promedio_minutos: Float
  }

  type EntradaHistorial {
    fecha: String
    id_medico: Int
    id_cita: Int
    observaciones: String
    diagnostico: String
    tratamiento: String
    archivos_adjuntos: [String]
  }

  type Historial {
    id_paciente: Int
    entradas: [EntradaHistorial]
  }

  type Query {
    citasFinalizadasPorMedico: [MedicoCitasFinalizadas]
    citasPendientesHoy: [Cita]
    duracionPromedioPorMedico: [DuracionPromedio]
    historialPaciente(id_paciente: Int!): Historial
  }
`;

export default typeDefs;
