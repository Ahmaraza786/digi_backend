const { Sequelize } = require('sequelize');
const config = require('./config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = { ...config[env] }; // Create a copy to avoid mutating original config

// Override database name with environment variable if provided
if (process.env.DB_NAME) {
  dbConfig.database = process.env.DB_NAME;
}

let sequelize;

if (dbConfig.use_env_variable) {
  // For production with DATABASE_URL, we need to handle it differently
  if (env === 'production' && process.env.DB_NAME) {
    // If DB_NAME is provided for production, construct the URL with the custom database name
    const url = new URL(process.env[dbConfig.use_env_variable]);
    url.pathname = `/${process.env.DB_NAME}`;
    sequelize = new Sequelize(url.toString(), dbConfig);
  } else {
    sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
  }
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

module.exports = sequelize;
