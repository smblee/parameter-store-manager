import AWS from 'aws-sdk';
import memoizeOne from 'memoize-one';
import localStore from '../store/localStore';

const ssm = memoizeOne(region => new AWS.SSM({ region }));
const kms = memoizeOne(region => new AWS.KMS({ region }));

const getSSM = () => ssm(localStore.get('ssmRegion'));
const getKMS = () => kms(localStore.get('kmsRegion'));

export default {
  getSSM,
  getKMS
};
