require('dotenv').config();
const config = require('./config.json');

// Normalize environment to lowercase
const env = (process.env.NODE_ENV || 'development').toLowerCase();

// Get the base configuration for the environment
const baseConfig = config[env] || config.development;
const dbConfig = { ...baseConfig };

// Override database name with environment variable if provided
if (process.env.DB_NAME) {
  dbConfig.database = process.env.DB_NAME;
}

// Override other database parameters if provided
if (process.env.DB_HOST) {
  dbConfig.host = process.env.DB_HOST;
}
if (process.env.DB_PORT) {
  dbConfig.port = process.env.DB_PORT;
}
if (process.env.DB_USERNAME) {
  dbConfig.username = process.env.DB_USERNAME;
}
if (process.env.DB_PASSWORD) {
  dbConfig.password = process.env.DB_PASSWORD;
}

// Return the configuration in the format Sequelize CLI expects
module.exports = {
  development: env === 'development' ? dbConfig : config.development,
  test: env === 'test' ? dbConfig : config.test,
  production: env === 'production' ? dbConfig : config.production
};
