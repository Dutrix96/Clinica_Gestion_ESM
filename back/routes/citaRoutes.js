import { Router } from 'express';
import { citasGet, citasPost, citaEstadoPut, citasDelete } from '../controllers/citaController.js';
import { validarJWT } from '../middlewares/validarJWT.js';
import { tieneRol } from '../middlewares/validarRoles.js';

export const router = Router();

router.get('/', [validarJWT, tieneRol('administrador', 'recepcionista', 'medico')], citasGet);
router.post('/', [validarJWT, tieneRol('administrador', 'recepcionista')], citasPost);
router.put('/:id/estado', [validarJWT, tieneRol('administrador', 'recepcionista', 'medico')], citaEstadoPut);
router.delete('/:id', [validarJWT, tieneRol('administrador')], citasDelete);
