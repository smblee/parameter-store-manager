import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Checkbox,
  Form,
  Icon,
  Input,
  message,
  Modal,
  Tooltip
} from 'antd';
import localStore, { availableSettings } from '../store/localStore';
import { formShape } from './formDataShape.propType';

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 14 }
};
const buttonItemLayout = {
  wrapperCol: { span: 14, offset: 4 }
};

class SettingsButton extends Component {
  static defaultProps = {
    buttonBlock: true
  };

  static propTypes = {
    buttonBlock: PropTypes.bool,
    form: PropTypes.shape(formShape).isRequired
  };

  state = { visible: false };

  showModal = () => {
    this.setState({
      visible: true
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    const { validateFields } = form;
    validateFields((validationErr, values) => {
      if (!validationErr) {
        try {
          // set the whole object at once.
          localStore.set(values);
          message.success('Settings were saved.');
          this.setState({
            visible: false
          });
        } catch (saveError) {
          message.error(
            'Something went wrong while saving settings',
            saveError
          );
        }
      }
    });
  };

  render() {
    const { form } = this.props;
    const { getFieldDecorator } = form;
    const { visible } = this.state;
    return (
      <div>
        <Button icon="setting" onClick={this.showModal} />
        {!visible ? null : (
          <Modal
            width={700}
            title="Settings"
            visible={visible}
            onCancel={this.handleCancel}
            footer={[
              <Button key="close" onClick={this.handleCancel}>
                Close
              </Button>
            ]}
          >
            <Form onSubmit={this.handleSubmit}>
              <Form.Item
                label={
                  <span>
                    Path Delimiter&nbsp;
                    <Tooltip title="If the typical parameter looks like this: 'path-to-parameter-value', the delimiter would be '-'. The recommended path delimiter is '/'.">
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </span>
                }
                {...formItemLayout}
              >
                {getFieldDecorator(availableSettings.pathDelimiter, {
                  initialValue: localStore.get(availableSettings.pathDelimiter),
                  rules: [
                    {
                      required: true,
                      message: 'Please provide a value.'
                    }
                  ]
                })(<Input placeholder="/" />)}
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    Path Filter&nbsp;
                    <Tooltip title="The filter to use to pull ssm params needed. To pull all params use ''.">
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </span>
                }
                {...formItemLayout}
              >
                {getFieldDecorator(availableSettings.pathFilter, {
                  initialValue: localStore.get(availableSettings.pathFilter)
                })(<Input placeholder="" />)}
              </Form.Item>
              <Form.Item label="AWS SSM Region" {...formItemLayout}>
                {getFieldDecorator(availableSettings.ssmRegion, {
                  initialValue: localStore.get(availableSettings.ssmRegion),
                  rules: [
                    {
                      required: true,
                      message: 'Please provide a value.'
                    }
                  ]
                })(<Input placeholder="eu-west-1" />)}
              </Form.Item>
              <Form.Item label="AWS KMS Region" {...formItemLayout}>
                {getFieldDecorator(availableSettings.kmsRegion, {
                  initialValue: localStore.get(availableSettings.kmsRegion),
                  rules: [
                    {
                      required: true,
                      message: 'Please provide a value.'
                    }
                  ]
                })(<Input placeholder="eu-west-1" />)}
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    AWS Profile&nbsp;
                    <Tooltip title="Changing the profile requires relaunching the application">
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </span>
                }
                {...formItemLayout}
              >
                {getFieldDecorator(availableSettings.profile, {
                  initialValue: localStore.get(availableSettings.profile),
                  rules: [
                    {
                      required: false,
                      message: 'Optional'
                    }
                  ]
                })(<Input placeholder="" />)}
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    AWS CA Bundle Path&nbsp;
                    <Tooltip title="Changing the ca bundle path requires relaunching the application">
                      <Icon type="question-circle-o" />
                    </Tooltip>
                  </span>
                }
                {...formItemLayout}
              >
                {getFieldDecorator(availableSettings.caBundlePath, {
                  initialValue: localStore.get(availableSettings.caBundlePath),
                  rules: [
                    {
                      required: false,
                      message: 'Optional'
                    }
                  ]
                })(<Input placeholder="" />)}
              </Form.Item>
              <Form.Item label="Hide Description" {...formItemLayout}>
                {getFieldDecorator(availableSettings.hideDescription, {
                  valuePropName: 'checked',
                  initialValue: localStore.get(
                    availableSettings.hideDescription
                  )
                })(<Checkbox />)}
              </Form.Item>
              <Form.Item label="Hide Last Modified Date" {...formItemLayout}>
                {getFieldDecorator(availableSettings.hideLastModifiedDate, {
                  valuePropName: 'checked',
                  initialValue: localStore.get(
                    availableSettings.hideLastModifiedDate
                  )
                })(<Checkbox />)}
              </Form.Item>
              <Form.Item label="Hide Type" {...formItemLayout}>
                {getFieldDecorator(availableSettings.hideType, {
                  valuePropName: 'checked',
                  initialValue: localStore.get(availableSettings.hideType)
                })(<Checkbox />)}
              </Form.Item>
              <Form.Item {...buttonItemLayout}>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        )}
      </div>
    );
  }
}

const WrappedSettingsButton = Form.create({ name: 'settings' })(SettingsButton);
export default WrappedSettingsButton;
