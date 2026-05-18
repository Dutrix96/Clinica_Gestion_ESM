import { Router } from 'express';
import { medicosGet, usuariosDelete, usuariosGet, usuariosPost, usuariosPut } from '../controllers/userController.js';
import { validarJWT } from '../middlewares/validarJWT.js';
import { tieneRol } from '../middlewares/validarRoles.js';

export const router = Router();

router.get('/medicos', [validarJWT, tieneRol('administrador', 'recepcionista', 'medico')], medicosGet);
router.get('/', [validarJWT, tieneRol('administrador')], usuariosGet);
router.post('/', [validarJWT, tieneRol('administrador')], usuariosPost);
router.put('/:id', [validarJWT, tieneRol('administrador')], usuariosPut);
router.delete('/:id', [validarJWT, tieneRol('administrador')], usuariosDelete);
