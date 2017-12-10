// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import { servers, servers_list, loading_status, requests } from './servers.js';

const rootReducer = combineReducers({
  router,
  requests: requests,
  loading_status: loading_status,
  servers_list: servers_list,
  servers: servers,
});

export default rootReducer;
