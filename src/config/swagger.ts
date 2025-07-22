import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';

const swaggerDocument = yaml.load(path.join(process.cwd(), 'docs/swagger.yaml'));

const options = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PoloTradeX API Docs',
};

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerDocument, options);