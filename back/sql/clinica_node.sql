DROP DATABASE IF EXISTS clinica_node;
CREATE DATABASE clinica_node CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinica_node;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('administrador', 'medico', 'recepcionista') NOT NULL,
  especialidad VARCHAR(120),
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  apellidos VARCHAR(180) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  email VARCHAR(160),
  fecha_nacimiento DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente INT NOT NULL,
  id_medico INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  estado ENUM('pendiente', 'en curso', 'finalizada', 'no presentado', 'cancelada') NOT NULL DEFAULT 'pendiente',
  duracion_minutos INT NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_paciente) REFERENCES pacientes(id),
  FOREIGN KEY (id_medico) REFERENCES usuarios(id)
);

CREATE INDEX idx_citas_fecha_estado ON citas(fecha_hora, estado);
CREATE INDEX idx_citas_medico_estado ON citas(id_medico, estado);
CREATE INDEX idx_pacientes_dni ON pacientes(dni);

INSERT INTO usuarios (nombre, email, password_hash, rol, especialidad) VALUES
('Admin Clinica', 'admin@clinica.test', '$2b$10$r/A03u0NuyC5wuTxl1ZI..xCExKv5ThmO7JlgjScUI2Kejd05uq8C', 'administrador', NULL),
('Dra. Laura Mesa', 'laura@clinica.test', '$2b$10$r/A03u0NuyC5wuTxl1ZI..xCExKv5ThmO7JlgjScUI2Kejd05uq8C', 'medico', 'Medicina general'),
('Recepcion Norte', 'recepcion@clinica.test', '$2b$10$r/A03u0NuyC5wuTxl1ZI..xCExKv5ThmO7JlgjScUI2Kejd05uq8C', 'recepcionista', NULL);

INSERT INTO pacientes (nombre, apellidos, dni, telefono, email, fecha_nacimiento) VALUES
('Ana', 'Garcia Lopez', '12345678Z', '600111222', 'ana.garcia@test.local', '1988-03-12'),
('Javier', 'Ruiz Martin', '87654321X', '600333444', 'javier.ruiz@test.local', '1975-10-04'),
('Alba', 'Maqueda', '11223344A', '600555666', 'alba.maqueda@test.local', '1992-07-21');

INSERT INTO citas (id_paciente, id_medico, fecha_hora, motivo, estado, duracion_minutos) VALUES
(1, 2, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Revision general no presentada', 'no presentado', 30),
(2, 2, NOW(), 'Seguimiento tratamiento finalizado', 'finalizada', 45),
(3, 2, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'Primera consulta pendiente', 'pendiente', 30);

-- Password de los tres usuarios de prueba: 123456
