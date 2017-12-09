import { push } from 'react-router-redux'
import { actions } from '../reducers/servers.js';
import axios from 'axios';
import storage from 'electron-json-storage';

const SERVER_LIST_URL = 'http://35.226.139.18:8080/api/v1/teams';

export function addServer(id: number) {
  return (dispatch) => {
    dispatch({
      type: actions.ADD_SERVER,
      id: id
    });
    dispatch(selectServer(id));
  }
}

export function selectServer(selected: number) {
  return (dispatch) => {
    dispatch(push("/main/servers/"+selected));
  }
}


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

function shouldLoadServerProgress(serverId, state) {
  return (
    // Have we started the request?
    !(serverId in state.requests.server_progress_requested) &&
    // Is the server done processing on the backend?
    !(state.servers[serverId].progress == 100)
  );
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

function receiveServerProgress(serverId, progress) {
  return {
    type: actions.RECEIVE_SERVER_PROGRESS,
    serverId: serverId,
    progress: progress,
  }
}

function requestServerProgress(serverId) {
  return {
    type: actions.REQUEST_SERVER_PROGRESS,
    serverId: serverId
  }
}

function timeoutServerProgress(serverId) {
  return {
    type: actions.TIMEOUT_SERVER_PROGRESS,
    serverId: serverId
  }
}

const SERVER_PROGRESS_INTERVAL = 2000;

function loadServerProgress(serverId) {
  return (dispatch, getState) => {
    // Say we are waiting for data
    dispatch(requestServerProgress(serverId));
    const domain = getState().servers_list[serverId].domain;
    axios.get(SERVER_LIST_URL+'/'+domain).then((response) => {
      var progress = response.data.progress;
      // We got data!
      dispatch(receiveServerProgress(serverId, progress));
      // After X ms, allow us to request data again!
      if (progress < 100) {
        setTimeout(() => dispatch(loadServerProgress(serverId)),
                                  SERVER_PROGRESS_INTERVAL);
      }
    }).catch((error) => {
      console.log(error);
    });
  }
}

export function loadServerProgressIfNeeded(serverId) {
  serverId = +serverId;
  return (dispatch, getState) => {
    if (shouldLoadServerProgress(serverId, getState())) {
      dispatch(loadServerProgress(serverId));
    }
  }
}
