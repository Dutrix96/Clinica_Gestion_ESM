import jwt from 'jsonwebtoken';
import { env } from './env.js';

export const generarJWT_Roles = (uid, roles) => {
  return jwt.sign({ uid, roles }, env.SECRETORPRIVATEKEY, { expiresIn: '4h' });
};
