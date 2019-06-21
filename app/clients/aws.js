import AWS from 'aws-sdk';
import memoizeOne from 'memoize-one';
import localStore from '../store/localStore';

process.env.AWS_SDK_LOAD_CONFIG = true;

const credentials = new AWS.SharedIniFileCredentials({
  profile: localStore.get('profile')
});
if (typeof credentials !== 'undefined' && credentials) {
  AWS.config.credentials = credentials;
}

const ssm = memoizeOne(region => new AWS.SSM({ region }));
const kms = memoizeOne(region => new AWS.KMS({ region }));

const getSSM = () => ssm(localStore.get('ssmRegion'));
const getKMS = () => kms(localStore.get('kmsRegion'));

export default {
  getSSM,
  getKMS
};
