import { Router } from 'express';
import { pacientesGet, pacienteGet, pacientesPost, pacientesDelete, generarPacientes } from '../controllers/pacienteController.js';
import { validarJWT } from '../middlewares/validarJWT.js';
import { tieneRol } from '../middlewares/validarRoles.js';

export const router = Router();

router.get('/', [validarJWT, tieneRol('administrador', 'recepcionista', 'medico')], pacientesGet);
router.get('/:id', [validarJWT, tieneRol('administrador', 'recepcionista', 'medico')], pacienteGet);
router.post('/', [validarJWT, tieneRol('administrador', 'recepcionista')], pacientesPost);
router.post('/generar', [validarJWT, tieneRol('administrador')], generarPacientes);
router.delete('/:id', [validarJWT, tieneRol('administrador')], pacientesDelete);
