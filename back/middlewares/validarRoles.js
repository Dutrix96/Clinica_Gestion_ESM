export const tieneRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolesUsuario = req.roles || [];
    const autorizado = rolesPermitidos.some(rol => rolesUsuario.includes(rol));

    if (!autorizado) {
      return res.status(403).json({ msg: 'No tienes permisos para acceder a esta funcionalidad.' });
    }

    next();
  };
};
