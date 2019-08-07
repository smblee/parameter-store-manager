import AWS from 'aws-sdk';
import memoizeOne from 'memoize-one';
import localStore from '../store/localStore';

process.env.AWS_SDK_LOAD_CONFIG = true;

const profile = localStore.get('profile');
const sharedIniFileCredentials = new AWS.SharedIniFileCredentials({ profile });
const processCredentials = new AWS.ProcessCredentials({ profile });

const chain = new AWS.CredentialProviderChain();
chain.providers.push(sharedIniFileCredentials);
chain.providers.push(processCredentials);
chain.resolve((err, credentials) => {
  if (typeof credentials !== 'undefined' && credentials) {
    AWS.config.credentials = credentials;
  }
});

const ssm = memoizeOne(region => new AWS.SSM({ region }));
const kms = memoizeOne(region => new AWS.KMS({ region }));

const getSSM = () => ssm(localStore.get('ssmRegion'));
const getKMS = () => kms(localStore.get('kmsRegion'));

export default {
  getSSM,
  getKMS
};
