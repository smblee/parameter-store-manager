import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import CreationForm from './CreationForm';
import { formDataShape } from './formDataShape.propType';

class CreationFormButton extends Component {
  static defaultProps = {
    buttonBlock: true,
    buttonText: 'Add New Parameter(s)',
    modalText: 'Add New Parameter(s)',
    buttonType: 'default',
    editFlow: false,
    initialFormData: null,
    resetOnClose: false
  };

  static propTypes = {
    buttonBlock: PropTypes.bool,
    buttonText: PropTypes.string,
    buttonType: PropTypes.string,
    editFlow: PropTypes.bool,
    initialFormData: PropTypes.shape(formDataShape),
    modalText: PropTypes.string,
    resetOnClose: PropTypes.bool
  };

  state = { visible: false };

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

  render() {
    const {
      modalText,
      buttonType,
      editFlow,
      buttonText,
      buttonBlock,
      initialFormData,
      resetOnClose
    } = this.props;
    const { visible } = this.state;
    return (
      <div>
        <Button type={buttonType} onClick={this.showModal} block={buttonBlock}>
          {buttonText}
        </Button>
        {resetOnClose && !visible ? null : (
          <Modal
            width={700}
            title={modalText}
            centered
            visible={visible}
            onCancel={this.handleCancel}
            footer={[
              <Button key="back" onClick={this.handleCancel}>
                Cancel
              </Button>
            ]}
          >
            <CreationForm
              initialFormData={initialFormData}
              editFlow={editFlow}
            />
          </Modal>
        )}
      </div>
    );
  }
}

export default CreationFormButton;
