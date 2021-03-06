/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Redirect, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import MainPage from './containers/MainPage';
import CounterPage from './containers/CounterPage';
import LoadingPage from './containers/LoadingPage';

export default function() {
  return (
    <App>
      <Switch>
        <Route path="/counter" component={CounterPage} />
        <Route path="/main" component={MainPage} />
        <Redirect from="/" to="/main" />
      </Switch>
    </App>
  );
};
