import React from 'react';
import { Button, notification, Popconfirm } from 'antd';
import PropTypes from 'prop-types';

class DeleteButton extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    onDelete: PropTypes.func.isRequired
  };

  delete = () => {
    const { onDelete, name } = this.props;
    return onDelete(name)
      .then(res => {
        notification.success({
          message: 'Parameter was deleted.'
        });
        return res;
      })
      .catch(err => {
        notification.error({
          message: 'Something went wrong while deleting the parameter.',
          description: err.code || ''
        });
        throw err;
      });
  };

  render() {
    const { name } = this.props;
    return (
      <Popconfirm
        placement="left"
        title={
          <div>
            <div>Are you sure you want to delete parameter</div>
            <code>{name}</code>
          </div>
        }
        onConfirm={this.delete}
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
