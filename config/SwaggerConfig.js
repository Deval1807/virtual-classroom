const swaggerui = require("swagger-ui-express");
const YAML = require('yamljs');

// Load the Swagger YAML file
const swaggerDoc = YAML.load('./utils/swaggerUtils.yml');

module.exports = { swaggerDoc, swaggerui };
