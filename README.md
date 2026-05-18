# Clinica Gestion ESM

Proyecto separado en dos carpetas al mismo nivel:

- `back`: servidor Node.js, Express, MySQL, MongoDB, GraphQL, JWT y WebSockets.
- `front`: cliente React con Vite para pintar login, panel por rol, pacientes, citas e historiales.

## Arranque

Instalacion completa:

```bash
npm run install:all
npm run seed
```

Para arrancar en Visual Studio Code abre dos terminales:

```bash
npm run back
```

```bash
npm run front
```

Si un puerto se queda ocupado:

```bash
npm run stop:back
npm run stop:front
```

Backend:

```bash
cd back
npm install
npm run seed
npm start
```

En Windows puedes crear el archivo de entorno asi, aunque el backend ya trae valores por defecto de desarrollo:

```powershell
Copy-Item .env.example .env
```

Frontend:

```bash
cd front
npm install
npm run dev
```

URLs:

- Backend: `http://localhost:9090`
- Frontend: `http://localhost:5173`

