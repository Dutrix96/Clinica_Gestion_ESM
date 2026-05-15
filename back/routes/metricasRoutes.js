import { Router } from 'express';
import { metricasGet } from '../controllers/metricasController.js';
import { validarJWT } from '../middlewares/validarJWT.js';
import { tieneRol } from '../middlewares/validarRoles.js';

export const router = Router();

router.get('/', [validarJWT, tieneRol('administrador')], metricasGet);
