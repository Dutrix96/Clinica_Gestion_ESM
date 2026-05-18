import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import kleur from 'kleur';
import { Server as SocketServer } from 'socket.io';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';

import typeDefs from '../typeDefs/typeDefs.js';
import resolvers from '../resolvers/resolvers.js';
import { validarJWT_GQL } from '../middlewares/validarJWT.js';
import { setIO } from '../helpers/socket.js';
import { env } from '../helpers/env.js';

import { router as authRoutes } from '../routes/authRoutes.js';
import { router as userRoutes } from '../routes/userRoutes.js';
import { router as pacienteRoutes } from '../routes/pacienteRoutes.js';
import { router as citaRoutes } from '../routes/citaRoutes.js';
import { router as historialRoutes } from '../routes/historialRoutes.js';
import { router as metricasRoutes } from '../routes/metricasRoutes.js';
import { router as sistemaRoutes } from '../routes/sistemaRoutes.js';

class Server {
  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.io = new SocketServer(this.httpServer, { cors: { origin: '*' } });

    this.graphQLPath = '/graphql';
    this.authPath = '/api/auth';
    this.usuariosPath = '/api/usuarios';
    this.pacientesPath = '/api/pacientes';
    this.citasPath = '/api/citas';
    this.historialesPath = '/api/historiales';
    this.metricasPath = '/api/metricas';
    this.sistemaPath = '/api/sistema';

    this.middlewares();
    this.conectarMongoose();
    this.sockets();
    this.routes();

    this.apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [{
        async requestDidStart() {
          return {
            async willSendResponse({ response, errors }) {
              if (errors) {
                response.body.singleResult.errors = errors.map(error => ({
                  message: error.message
                }));
              }
            }
          };
        }
      }]
    });
  }

  conectarMongoose() {
    mongoose.set('strictQuery', false);
    mongoose.connect(env.MONGO_URL, { dbName: env.MONGO_DATABASE });
    this.db = mongoose.connection;
    this.db.on('error', console.error.bind(console, 'Error de conexion a MongoDB:'));
    this.db.once('open', () => {
      console.log(kleur.green(`Conexion exitosa a MongoDB: ${env.MONGO_URL}/${env.MONGO_DATABASE}`));
    });
  }

  middlewares() {
    this.app.use(cors({
      origin: '*',
      allowedHeaders: ['Content-Type', 'x-token']
    }));
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  sockets() {
    setIO(this.io);
    this.io.on('connection', socket => {
      console.log(kleur.yellow(`Cliente conectado por WebSocket: ${socket.id}`));
    });
  }

  routes() {
    this.app.use(this.authPath, authRoutes);
    this.app.use(this.usuariosPath, userRoutes);
    this.app.use(this.pacientesPath, pacienteRoutes);
    this.app.use(this.citasPath, citaRoutes);
    this.app.use(this.historialesPath, historialRoutes);
    this.app.use(this.metricasPath, metricasRoutes);
    this.app.use(this.sistemaPath, sistemaRoutes);
  }

  async start() {
    await this.apolloServer.start();

    this.app.use(
      this.graphQLPath,
      express.json(),
      expressMiddleware(this.apolloServer, {
        context: async ({ req }) => validarJWT_GQL({ req })
      })
    );

    this.listen();
  }

  listen() {
    this.httpServer.once('error', error => {
      if (error.code === 'EADDRINUSE') {
        console.error(`El puerto ${env.PORT} ya esta ocupado. Cierra el backend anterior o ejecuta: npm run stop:back desde la raiz.`);
        process.exit(1);
      }

      throw error;
    });

    this.httpServer.listen(env.PORT, () => {
      console.log(kleur.green(`Servidor escuchando en: ${env.DB_URL_GRAPHQL}:${env.PORT}`));
      console.log(kleur.blue(`API Auth: ${env.DB_URL_GRAPHQL}:${env.PORT}${this.authPath}`));
      console.log(kleur.blue(`API Citas: ${env.DB_URL_GRAPHQL}:${env.PORT}${this.citasPath}`));
      console.log(kleur.red(`GraphQL privado: ${env.DB_URL_GRAPHQL}:${env.PORT}${this.graphQLPath}`));
    });
  }
}

export { Server };
