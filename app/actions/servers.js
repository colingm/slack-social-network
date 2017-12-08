import { actions } from '../reducers/servers.js';
import axios from 'axios';
import storage from 'electron-json-storage';

const SERVER_LIST_URL = 'http://35.226.139.18:8080/api/v1/teams';

function requestServersList() {
  return {
    type: actions.REQUEST_SERVERS_LIST,
  };
}

function requestServers() {
  return {
    type: actions.REQUEST_SERVERS,
  };
}

function receiveServersList(servers_list) {
  return {
    type: actions.RECEIVE_SERVERS_LIST,
    new_state: servers_list
  };
}

function receiveServers(servers) {
  return {
    type: actions.RECEIVE_SERVERS,
    new_state: servers
  };
}

function shouldLoadServersList(state) {
  return !state.requests.servers_list_requested &&
         !state.loading_status.servers_list_loaded;
}

function shouldLoadServers(state) {
  return !state.requests.servers_requested &&
         !state.loading_status.servers_loaded;
}

export function loadServersListIfNeeded() {
  return (dispatch, getState) => {
    if (shouldLoadServersList(getState())) {
      dispatch(requestServersList());
      storage.get('servers_list', (error, data) => {
        if (!Array.isArray(data) || data.length == 0) {
          axios.get(SERVER_LIST_URL).then((response) => {
            dispatch(receiveServersList(response.data));
          }).catch((error) => {
            console.log(error);
          });
        } else {
          dispatch(receiveServersList(data));
        }
      });
    }
  }
}

export function loadServersIfNeeded() {
  return (dispatch, getState) => {
    if (shouldLoadServers(getState())) {
      dispatch(requestServers());
      storage.get('servers', (error, data) => {
        if (data === null) {
          data = {};
        }
        dispatch(receiveServers(data));
      });
    }
  }
}
