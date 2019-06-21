import Store from 'electron-store';

const availableSettings = {
  pathDelimiter: 'pathDelimiter',
  ssmRegion: 'ssmRegion',
  kmsRegion: 'kmsRegion',
  profile: 'profile'
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
  },
  [availableSettings.profile]: {
    type: 'string',
    default: ''
  }
};

const localStore = new Store({ schema });

export { availableSettings };

export default localStore;
