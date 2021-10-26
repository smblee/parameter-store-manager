import AWS from 'aws-sdk';
import { Agent as httpsAgent } from 'https';
import { readFileSync as fsReadFileSync } from 'fs';
import localStore, { availableSettings } from '../store/localStore';

process.env.AWS_SDK_LOAD_CONFIG = true;

const credentialProvider = new AWS.CredentialProviderChain([
  () => new AWS.EnvironmentCredentials('AWS'),
  () => new AWS.EnvironmentCredentials('AMAZON'),
  () =>
    new AWS.SharedIniFileCredentials({
      profile: localStore.get(availableSettings.profile)
    }),
  () =>
    new AWS.ProcessCredentials({
      profile: localStore.get(availableSettings.profile)
    })
  // TODO: Add more credential providers as needed. https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html#providers-property
]);

const caBundlePath = localStore.get(availableSettings.caBundlePath);

const ssm = region => {
  const awsConfig: AWS.SSM.ClientConfiguration = {
    region,
    credentials: null,
    credentialProvider
  };
  if (caBundlePath) {
    awsConfig.httpOptions = {
      // eslint-disable-next-line new-cap
      agent: new httpsAgent({ ca: fsReadFileSync(caBundlePath) })
    };
  }
  return new AWS.SSM(awsConfig);
};
const kms = region => {
  const awsConfig: AWS.KMS.ClientConfiguration = {
    region,
    credentials: null,
    credentialProvider
  };
  if (caBundlePath) {
    awsConfig.httpOptions = {
      // eslint-disable-next-line new-cap
      agent: new httpsAgent({ ca: fsReadFileSync(caBundlePath) })
    };
  }
  return new AWS.KMS(awsConfig);
};

const getSSM = () => ssm(localStore.get(availableSettings.ssmRegion));
const getKMS = () => kms(localStore.get(availableSettings.kmsRegion));

export default {
  getSSM,
  getKMS
};
