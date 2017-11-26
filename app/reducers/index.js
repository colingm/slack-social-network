// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { servers } from './servers.js';

const rootReducer = combineReducers({
  router,
  servers: servers,
});

export default rootReducer;
