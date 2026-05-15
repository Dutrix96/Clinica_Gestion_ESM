# Plataforma de Gestion Clinica

Proyecto de recuperacion de Node siguiendo la estructura de los ejemplos de clase: `app`, `routes`, `controllers`, `middlewares`, `models`, `typeDefs` y `resolvers`.

## Estructura

- `app`: arranque de Express, Apollo Server y WebSockets.
- `routes`: puntos de acceso REST separados por entidad.
- `controllers`: logica de cada ruta, siguiendo el patron usado en clase.
- `middlewares`: verificacion JWT y control de roles.
- `database`: conexion a MySQL para informacion estructurada.
- `models`: modelos Mongoose para informacion documental.
- `typeDefs` y `resolvers`: consultas GraphQL obligatorias.
- `public`: cliente HTML, CSS y JavaScript funcional.
- `sql` y `mongo`: datos exportados para la entrega.

## Puesta en marcha

1. Crear la base de datos SQL importando `sql/clinica_node.sql`.
2. Importar `mongo/historiales.json` en MongoDB, base `clinica_node`, coleccion `historials`.
3. Copiar `.env.example` como `.env` y ajustar usuario/password de MySQL.
4. Instalar dependencias con `npm install`.
5. Arrancar con `npm run dev` o `npm start`.
6. Abrir `http://localhost:9090`.

Usuarios de prueba:

- `admin@clinica.test` / `123456`
- `laura@clinica.test` / `123456`
- `recepcion@clinica.test` / `123456`

## GraphQL

Ruta privada: `POST /graphql`

Enviar el token en la cabecera `x-token`.

Consultas obligatorias implementadas:

- `citasFinalizadasPorMedico`
- `citasPendientesHoy`
- `duracionPromedioPorMedico`
- `historialPaciente(id_paciente: Int!)`
