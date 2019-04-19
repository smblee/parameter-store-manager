import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import Home from './components/Home';

export default () => (
  <App>
    <Switch>
      <Route path={routes.HOME} component={Home} />
    </Switch>
  </App>
);
