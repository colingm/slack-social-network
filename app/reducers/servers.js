// @flow
import { deepCopy } from '../util';
import storage from 'electron-json-storage';


export const actions = {
  LOAD_SERVERS: 'LOAD_SERVERS',
  LOAD_SERVERS_LIST: 'LOAD_SERVERS_LIST',
  ADD_SERVER: 'ADD_SERVER',
  ADD_GRAPH: 'ADD_GRAPH'
};

const LOADING_STATUS_DEFAULT = {
  servers_loaded: false,
  servers_list_loaded: false
};

export function loading_status(state = LOADING_STATUS_DEFAULT, action) {
  switch (action.type) {
    case actions.LOAD_SERVERS: {
      let new_state = deepCopy(state);
      new_state.servers_loaded = true;
      return new_state;
      break;
    }
    case actions.LOAD_SERVERS_LIST: {
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
    case actions.LOAD_SERVERS_LIST: {
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
    case actions.LOAD_SERVERS: {
      return action.new_state;
      break;
    }
  }
  return state;
}
