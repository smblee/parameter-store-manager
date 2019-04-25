import React, { Component } from 'react';
import { Button, Form, Icon, Input, Modal, Tooltip, message } from 'antd';
import localStore, { availableSettings } from '../store/localStore';

class SettingsButton extends Component {
  state = { visible: false };

  static defaultProps = {
    buttonBlock: true
  };

  showModal = () => {
    this.setState({
      visible: true
    });
  };

  handleCancel = e => {
    this.setState({
      visible: false
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        try {
          // set the whole object at once.
          localStore.set(values);
          message.success('Settings were saved.');
        } catch (err) {
          message.error('Something went wrong while saving settings', err);
        }
      }
    });
  };

  render() {
    const formItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 }
    };
    const buttonItemLayout = {
      wrapperCol: { span: 14, offset: 4 }
    };

    const { getFieldDecorator } = this.props.form;

    return (
      <div>
        <Button icon="setting" onClick={this.showModal} />
        {!this.state.visible ? null : (
          <Modal
            width={700}
            title="Settings"
            visible={this.state.visible}
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
