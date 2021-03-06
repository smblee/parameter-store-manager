import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import Routes from '../Routes';

export default class Root extends Component {
  static propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    history: PropTypes.any.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    store: PropTypes.any.isRequired
  };

  render() {
    const { store, history } = this.props;
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Routes />
        </ConnectedRouter>
      </Provider>
    );
  }
}
