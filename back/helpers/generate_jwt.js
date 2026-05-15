import jwt from 'jsonwebtoken';

export const generarJWT_Roles = (uid, roles) => {
  return jwt.sign({ uid, roles }, process.env.SECRETORPRIVATEKEY, { expiresIn: '4h' });
};
