import AWS from 'aws-sdk';
import localStore from '../store/localStore';

const ssm = region => new AWS.SSM({ region });
const kms = region => new AWS.KMS({ region });

const getSSM = () => ssm(localStore.get('ssmRegion'));
const getKMS = () => kms(localStore.get('kmsRegion'));

export default {
  getSSM,
  getKMS
};
