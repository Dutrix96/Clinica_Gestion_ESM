import jwt from 'jsonwebtoken';

export const validarJWT = (req, res, next) => {
  const token = req.header('x-token');

  if (!token) {
    return res.status(401).json({ msg: 'No hay token en la peticion.' });
  }

  try {
    const { uid, roles } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
    req.uid = uid;
    req.roles = roles;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ msg: 'Token no valido.' });
  }
};

export const validarJWT_GQL = context => {
  const token = context.req.headers['x-token'];

  if (!token) {
    throw new Error('No hay token en la solicitud.');
  }

  try {
    const { uid, roles } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
    context.user = { uid, roles };
    return context;
  } catch (error) {
    throw new Error('Token no valido.');
  }
};
