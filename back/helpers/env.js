export const env = {
  PORT: process.env.PORT || '9090',
  DB_URL_GRAPHQL: process.env.DB_URL_GRAPHQL || 'http://localhost',
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
  MYSQL_USER: process.env.MYSQL_USER || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'clinica_node',
  MONGO_URL: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017',
  MONGO_DATABASE: process.env.MONGO_DATABASE || 'clinica_node',
  SECRETORPRIVATEKEY: process.env.SECRETORPRIVATEKEY || 'clave_super_secreta_recuperacion_node'
};
