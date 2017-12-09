// @flow
import { deepCopy } from '../util';
import storage from 'electron-json-storage';

export const actions = {
  ADD_SERVER: 'ADD_SERVER',
  ADD_GRAPH: 'ADD_GRAPH',

  RECEIVE_SERVERS: 'RECEIVE_SERVERS',
  RECEIVE_SERVERS_LIST: 'RECEIVE_SERVERS_LIST',
  RECEIVE_SERVER_PROGRESS: 'RECEIVE_SERVER_PROGRESS',

  REQUEST_SERVERS: 'REQUEST_SERVERS',
  REQUEST_SERVERS_LIST: 'REQUEST_SERVERS_LIST',
  REQUEST_SERVER_PROGRESS: 'REQUEST_SERVER_PROGRESS',

  TIMEOUT_SERVER_PROGRESS: 'TIMEOUT_SERVER_PROGRESS',
};

const REQUESTS_DEFAULT = {
  servers_requested: false,
  servers_list_requested: false,
  server_progress_requested: {},
};

export function requests(state = REQUESTS_DEFAULT, action) {
  switch (action.type) {
    case actions.REQUEST_SERVERS_LIST: {
      let new_state = deepCopy(state);
      new_state.servers_list_requested = true;
      return new_state;
      break;
    }
    case actions.REQUEST_SERVERS: {
      let new_state = deepCopy(state);
      new_state.servers_requested = true;
      return new_state;
      break;
    }
    case actions.REQUEST_SERVER_PROGRESS: {
      let new_state = deepCopy(state);
      new_state.server_progress_requested[action.serverId] = 1;
      return new_state;
      break;
    }
    case actions.RECEIVE_SERVERS_LIST: {
      let new_state = deepCopy(state);
      new_state.servers_list_requested = false;
      return new_state;
      break;
    }
    case actions.RECEIVE_SERVERS: {
      let new_state = deepCopy(state);
      new_state.servers_requested = false;
      return new_state;
      break;
    }
    case actions.TIMEOUT_SERVER_PROGRESS: {
      let new_state = deepCopy(state);
      new_state.server_progress_requested[action.serverId] = {
        stalling: false
      };
      return new_state;
      break;
    }
  }
  return state;
}

const LOADING_STATUS_DEFAULT = {
  servers_loaded: false,
  servers_list_loaded: false,
};

export function loading_status(state = LOADING_STATUS_DEFAULT, action) {
  switch (action.type) {
    case actions.RECEIVE_SERVERS: {
      let new_state = deepCopy(state);
      new_state.servers_loaded = true;
      return new_state;
      break;
    }
    case actions.RECEIVE_SERVERS_LIST: {
      let new_state = deepCopy(state);
      new_state.servers_list_loaded = true;
      return new_state;
      break;
    }
  }
  return state;
}

export function servers_list(state = {}, action: {type: string}) {
  switch (action.type) {
    case actions.RECEIVE_SERVERS_LIST: {
      storage.set('servers_list', action.new_state);
      return action.new_state;
      break;
    }
  }
  return state;
}

export function servers(state = {}, action: {type: string}) {
  switch (action.type) {
    case actions.ADD_SERVER: {
      let new_state = deepCopy(state);
      new_state[action.id] = {
        id: action.id,
        progress: 0,
        graphs: {
        }
      };
      storage.set('servers', new_state);
      return new_state;
      break;
    }
    case actions.ADD_GRAPH: {
      let new_state = deepCopy(state);
      new_state[action.serverId].graphs[action.graphName] = {
        name : action.graphName
      }
      storage.set('servers', new_state);
      return new_state;
    }
    case actions.RECEIVE_SERVERS: {
      return action.new_state;
      break;
    }
    case actions.RECEIVE_SERVER_PROGRESS: {
      let new_state = deepCopy(state);
      new_state[action.serverId].progress = action.progress;
      return new_state;
      break;
    }
  }
  return state;
}
