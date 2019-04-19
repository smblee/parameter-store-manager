import React, { Component } from 'react';
import { Button, Modal } from 'antd';
import CreationForm from './CreationForm';

class CreationFormButton extends Component {
  state = { visible: false };

  static defaultProps = {
    buttonBlock: true
  };

  showModal = () => {
    this.setState({
      visible: true
    });
  };

  handleOk = e => {
    console.log(e);
    this.setState({
      visible: false
    });
  };

  handleCancel = e => {
    console.log(e);
    this.setState({
      visible: false
    });
  };

  render() {
    return (
      <div>
        <Button
          type={this.props.buttonType || 'default'}
          onClick={this.showModal}
          block={this.props.buttonBlock}
        >
          {this.props.buttonText || 'Add New Parameter(s)'}
        </Button>
        {this.props.resetOnClose && !this.state.visible ? null : (
          <Modal
            width={700}
            title={this.props.modalText || 'Add New Parameter(s)'}
            centered
            visible={this.state.visible}
            onCancel={this.handleCancel}
            footer={[
              <Button key="back" onClick={this.handleCancel}>
                Cancel
              </Button>
            ]}
          >
            <CreationForm
              initialFormData={this.props.initialFormData}
              editFlow={this.props.editFlow}
            />
          </Modal>
        )}
      </div>
    );
  }
}

export default CreationFormButton;
