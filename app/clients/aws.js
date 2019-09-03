import AWS from 'aws-sdk';
import localStore from '../store/localStore';

process.env.AWS_SDK_LOAD_CONFIG = true;

const credentialProvider = new AWS.CredentialProviderChain([
  () => new AWS.EnvironmentCredentials('AWS'),
  () => new AWS.EnvironmentCredentials('AMAZON'),
  () =>
    new AWS.SharedIniFileCredentials({ profile: localStore.get('profile') }),
  () => new AWS.ProcessCredentials({ profile: localStore.get('profile') })
  // TODO: Add more credential providers as needed. https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html#providers-property
]);

const ssm = region =>
  new AWS.SSM({ region, credentials: null, credentialProvider });
const kms = region =>
  new AWS.KMS({ region, credentials: null, credentialProvider });

const getSSM = () => ssm(localStore.get('ssmRegion'));
const getKMS = () => kms(localStore.get('kmsRegion'));

export default {
  getSSM,
  getKMS
};
