import { Router } from 'express';
import { historialDelete, historialGet, entradaHistorialPost } from '../controllers/historialController.js';
import { validarJWT } from '../middlewares/validarJWT.js';
import { tieneRol } from '../middlewares/validarRoles.js';

export const router = Router();

router.get('/:idPaciente', [validarJWT, tieneRol('administrador', 'medico')], historialGet);
router.post('/entrada', [validarJWT, tieneRol('medico')], entradaHistorialPost);
router.delete('/:idPaciente', [validarJWT, tieneRol('administrador')], historialDelete);
