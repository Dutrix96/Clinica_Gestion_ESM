import { Router } from 'express';
import { usuariosGet, usuariosPost } from '../controllers/userController.js';
import { validarJWT } from '../middlewares/validarJWT.js';
import { tieneRol } from '../middlewares/validarRoles.js';

export const router = Router();

router.get('/', [validarJWT, tieneRol('administrador')], usuariosGet);
router.post('/', [validarJWT, tieneRol('administrador')], usuariosPost);
