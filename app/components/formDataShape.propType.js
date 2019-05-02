import PropTypes from 'prop-types';

export const formShape = {
  resetFields: PropTypes.func,
  validateFields: PropTypes.func,
  getFieldDecorator: PropTypes.func,
  getFieldValue: PropTypes.func
};

export const formDataShape = {
  name: PropTypes.string,
  description: PropTypes.string,
  type: PropTypes.oneOf(['String', 'SecureString']),
  kmsKey: PropTypes.shape,
  value: PropTypes.string
};
