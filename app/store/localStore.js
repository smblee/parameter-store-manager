import Store from 'electron-store';

const availableSettings = {
  pathDelimiter: 'pathDelimiter',
  ssmRegion: 'ssmRegion',
  kmsRegion: 'kmsRegion'
};

const schema = {
  [availableSettings.pathDelimiter]: {
    type: 'string',
    default: '/'
  },
  [availableSettings.ssmRegion]: {
    type: 'string',
    default: 'eu-west-1'
  },
  [availableSettings.kmsRegion]: {
    type: 'string',
    default: 'eu-west-1'
  }
};

const localStore = new Store({ schema });

export { availableSettings };

export default localStore;
