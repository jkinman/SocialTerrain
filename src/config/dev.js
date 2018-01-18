import baseConfig from './base';

const config = {
  appEnv: 'dev',
  // severUrl: 'http://localhost:3000',
  serverUrl: 'https://socialterrain.herokuapp.com',
};

export default Object.freeze(Object.assign({}, baseConfig, config));
