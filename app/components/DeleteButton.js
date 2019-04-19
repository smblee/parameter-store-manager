import React from 'react';
import { Popover, Button, Popconfirm, notification } from 'antd';

class DeleteButton extends React.Component {
  state = {
    visible: false
  };

  hide = () => {
    this.setState({
      visible: false
    });
  };

  onDelete = () => {
    return this.props
      .onDelete(this.props.name)
      .then(res => {
        console.log(res);
        notification.success({
          message: 'Parameter was deleted.'
        });
      })
      .catch(err => {
        console.log(err.code, err.message);
        notification.error({
          message: 'Something went wrong while deleting the parameter.',
          description: err.code || ''
        });
        throw err;
      });
  };

  render() {
    return (
      <Popconfirm
        placement="left"
        title={
          <div>
            <div>Are you sure you want to delete parameter</div>
            <code>{this.props.name}</code>
          </div>
        }
        onConfirm={this.onDelete}
        onCancel={this.hide}
        okText="Yes"
        cancelText="No"
      >
        <Button type="danger">Delete</Button>
      </Popconfirm>
    );
  }
}

export default DeleteButton;
