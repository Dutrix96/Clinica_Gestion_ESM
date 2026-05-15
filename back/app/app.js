import { Server } from './server.js';

const server = new Server();
server.start().catch(console.error);
