import Store from 'electron-store';

const availableSettings = {
  pathFilter: 'pathFilter',
  pathDelimiter: 'pathDelimiter',
  ssmRegion: 'ssmRegion',
  kmsRegion: 'kmsRegion',
  profile: 'profile',
  caBundlePath: 'caBundlePath',
  hideDescription: 'hideDescription',
  hideLastModifiedDate: 'hideLastModifiedDate',
  hideType: 'hideType'
};

const schema = {
  [availableSettings.pathFilter]: {
    type: 'string',
    default: ''
  },
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
  },
  [availableSettings.caBundlePath]: {
    type: 'string',
    default: ''
  },
  [availableSettings.hideDescription]: {
    type: 'boolean',
    default: false
  },
  [availableSettings.hideLastModifiedDate]: {
    type: 'boolean',
    default: false
  },
  [availableSettings.hideType]: {
    type: 'boolean',
    default: false
  }
};

const localStore = new Store({ schema });

export { availableSettings };

export default localStore;
