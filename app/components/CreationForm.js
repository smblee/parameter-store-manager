import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  notification,
  Radio,
  Row,
  Select
} from 'antd';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { formShape, formDataShape } from './formDataShape.propType';
import {
  actions as parameterActions,
  selectors as parameterSelectors
} from '../ducks/parameters';

const { Option } = Select;
const { TextArea } = Input;

const ENTITY_STATUS = {
  initial: 'entity_status:initial',
  loading: 'entity_status:loading',
  loaded: 'entity_status:loaded',
  error: 'entity_status:error'
};

class CreationForm extends React.Component {
  static propTypes = {
    createGenericParameter: PropTypes.func.isRequired,
    createServiceParameters: PropTypes.func.isRequired,
    editFlow: PropTypes.bool.isRequired,
    fetchKmsKeys: PropTypes.func.isRequired,
    form: PropTypes.shape(formShape).isRequired,
    initialFormData: PropTypes.shape(formDataShape),
    kmsKeyLoadError: PropTypes.bool,
    kmsKeyLoaded: PropTypes.bool,
    kmsKeyLoading: PropTypes.bool,
    kmsKeys: PropTypes.arrayOf(PropTypes.object)
  };

  static defaultProps = {
    initialFormData: null,
    kmsKeyLoadError: false,
    kmsKeyLoaded: false,
    kmsKeyLoading: false,
    kmsKeys: []
  };

  constructor(props) {
    super(props);

    const { initialFormData, editFlow } = props;

    this.state = {
      creationType: initialFormData || editFlow ? 'generic' : 'service',
      creationState: ENTITY_STATUS.initial,
      initialFormData: initialFormData || {}
    };
  }

  componentDidMount() {
    const { fetchKmsKeys } = this.props;
    fetchKmsKeys();
  }

  handleSubmit = e => {
    e.preventDefault();
    const {
      form,
      editFlow,
      createServiceParameters,
      createGenericParameter
    } = this.props;
    const { validateFields } = form;
    validateFields((validationErr, values) => {
      if (!validationErr) {
        const { creationType } = this.state;
        const creationFn =
          creationType === 'service'
            ? createServiceParameters
            : createGenericParameter;
        this.setState({ creationState: ENTITY_STATUS.loading });
        creationFn(values, !!editFlow)
          .then(res => {
            notification.success({
              message: editFlow
                ? 'Parameter was saved.'
                : 'Parameter(s) were created.'
            });
            this.setState({ creationState: ENTITY_STATUS.loaded });
            return res;
          })
          .catch(creationError => {
            console.log(creationError);
            notification.error({
              message: editFlow
                ? 'Parameter was not saved'
                : 'One or more parameters were not created.',
              description: creationError.message || ''
            });
            this.setState({ creationState: ENTITY_STATUS.error });
          });
      }
    });
  };

  onCreationTypeChange = e => {
    this.setState({ creationType: e.target.value });
  };

  render() {
    const {
      form,
      kmsKeyLoading,
      kmsKeyLoaded,
      kmsKeyLoadError,
      kmsKeys,
      editFlow
    } = this.props;

    const { getFieldDecorator } = form;
    const { creationType, creationState, initialFormData } = this.state;
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        {!editFlow && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="ant-form-text">Parameter Type: </span>
            <Radio.Group
              buttonStyle="solid"
              onChange={this.onCreationTypeChange}
              value={creationType}
            >
              <Radio.Button value="service">Service</Radio.Button>
              <Radio.Button value="generic">Generic</Radio.Button>
              <Radio.Button value="client" disabled>
                Client
              </Radio.Button>
            </Radio.Group>
          </div>
        )}
        <Form {...formItemLayout} onSubmit={this.handleSubmit}>
          {creationType === 'service' && (
            <Form.Item label="Service Name">
              {getFieldDecorator('serviceName', {
                rules: [
                  {
                    required: true,
                    message: "Please provide the service's name."
                  },
                  {
                    pattern: /^[^\s\\/]+$/,
                    message: 'Whitespace, /, \\ is not allowed.'
                  }
                ]
              })(<Input placeholder="pricingterm" />)}
            </Form.Item>
          )}
          <Form.Item label="Parameter Name">
            {getFieldDecorator('name', {
              initialValue: initialFormData.name,
              rules: [
                {
                  required: true,
                  message: 'Please provide the parameter name.'
                },
                creationType === 'service' && {
                  pattern: /^[^\s\\/]+$/,
                  message: 'Whitespace, /, \\ is not allowed.'
                }
              ]
            })(
              <Input
                placeholder={
                  creationType === 'service'
                    ? 'Auth0ClientUrl'
                    : '/packages/common/ClientSecretNoPermissions'
                }
                disabled={editFlow}
              />
            )}
          </Form.Item>

          <Form.Item label="Description">
            {getFieldDecorator('description', {
              initialValue: initialFormData.description
            })(
              <Input placeholder="This is used by the integration tests for the parameter store package" />
            )}
          </Form.Item>
          {creationType === 'service' && (
            <Form.Item label="Environments">
              {getFieldDecorator('environments', {
                initialValue: ['local', 'fea', 'stg', 'prd'],
                rules: [
                  {
                    required: true,
                    message: 'Please select at least one environment',
                    type: 'array'
                  }
                ]
              })(
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row>
                    <Col span={6}>
                      <Checkbox value="local">local</Checkbox>
                    </Col>
                    <Col span={6}>
                      <Checkbox value="fea">fea</Checkbox>
                    </Col>
                    <Col span={6}>
                      <Checkbox value="stg">stg</Checkbox>
                    </Col>
                    <Col span={6}>
                      <Checkbox value="prd">prd</Checkbox>
                    </Col>
                    <Col span={6}>
                      <Checkbox value="common">common</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              )}
            </Form.Item>
          )}
          <Form.Item label="Type">
            {getFieldDecorator('type', {
              initialValue: initialFormData.type || 'String',
              rules: [
                { required: true, message: 'Please select the parameter type.' }
              ]
            })(
              <Radio.Group>
                <Radio value="String">String</Radio>
                <Radio value="SecureString">SecureString</Radio>
                <Radio value="StringList" disabled>
                  StringList (Not supported yet)
                </Radio>
              </Radio.Group>
            )}
          </Form.Item>
          {form.getFieldValue('type') === 'SecureString' && (
            <Form.Item label="Select KMS Key" hasFeedback>
              {getFieldDecorator('kmsKey', {
                initialValue: initialFormData.kmsKey,
                rules: [
                  {
                    required: true,
                    message:
                      'Please select the KMS Key to encrypt the Secure String.'
                  }
                ]
              })(
                <Select
                  placeholder="Please select a KMS key"
                  loading={kmsKeyLoading}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.props.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {!kmsKeyLoadError &&
                    kmsKeyLoaded &&
                    kmsKeys.map(key => (
                      <Option value={key.AliasName}>{key.AliasName}</Option>
                    ))}
                </Select>
              )}
            </Form.Item>
          )}
          <Form.Item label="Value">
            {getFieldDecorator('value', {
              initialValue: initialFormData.value,
              rules: [
                { required: true, message: 'Please provide the value.' },
                {
                  max: 4096,
                  message: 'The maximum allowed length is 4096 characters.'
                }
              ]
            })(<TextArea rows={4} autosize={{ minRows: 2, maxRows: 8 }} />)}
          </Form.Item>

          {!editFlow &&
            creationType === 'service' &&
            form.getFieldValue('serviceName') &&
            form.getFieldValue('name') &&
            form.getFieldValue('environments').length && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <div>
                  <b>{`${
                    (form.getFieldValue('environments') || []).length
                  } parameter(s)`}</b>{' '}
                  will be created with the following name(s):
                </div>
                <div>
                  {(form.getFieldValue('environments') || []).map(env => (
                    <h4>
                      /services/{env}/{form.getFieldValue('serviceName')}/
                      {form.getFieldValue('name')}{' '}
                    </h4>
                  ))}
                </div>
              </div>
            )}
          {!editFlow &&
            creationType === 'generic' &&
            form.getFieldValue('name') && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <div>
                  <b>1 parameter</b> will be created with the following name:
                </div>
                <h4>{form.getFieldValue('name')}</h4>
              </div>
            )}
          <Form.Item wrapperCol={{ span: 12, offset: 6 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={creationState === ENTITY_STATUS.loading}
            >
              {editFlow ? 'Save' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    kmsKeyLoaded: parameterSelectors.getIsKmsKeyLoaded(state),
    kmsKeyLoading: parameterSelectors.getIsKmsKeyLoading(state),
    kmsKeyLoadError: parameterSelectors.getKmsKeyLoadHasError(state),
    kmsKeys: parameterSelectors.getKmsKeys(state)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(parameterActions, dispatch);
}

const WrappedParameterCreationForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(Form.create({ name: 'parameter_creation' })(CreationForm));

export default WrappedParameterCreationForm;
