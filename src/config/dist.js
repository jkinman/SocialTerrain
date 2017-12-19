import baseConfig from './base';

const config = {
  appEnv: 'dist',
  serverUrl: 'https://socialterrain.herokuapp.com/',
  
};

export default Object.freeze(Object.assign({}, baseConfig, config));
