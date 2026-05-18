import { Router } from 'express';
import { emitirRefrescoGeneral } from '../helpers/socket.js';

export const router = Router();

router.post('/seed-refrescado', async (req, res) => {
  await emitirRefrescoGeneral('seed_refrescado');
  res.json({ ok: true });
});
