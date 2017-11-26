// @flow
import { deepCopy } from '../util';
import storage from 'electron-json-storage';

let def_icon = "http://iosicongallery.com/img/512/slack-2014.png";

export const actions = {
  LOAD_STATE: 'LOAD_STATE',
  ADD_SERVER: 'ADD_SERVER',
  ADD_GRAPH: 'ADD_GRAPH'
};

export function servers(state = {}, action: {type: string}) {
  switch (action.type) {
    case actions.ADD_SERVER: {
      let new_state = deepCopy(state);
      new_state[action.name] = {
        name: action.name,
        icon: def_icon,
        graphs: {
        }
      };
      storage.set('servers', new_state);
      return new_state;
      break;
    }
    case actions.ADD_GRAPH: {
      let new_state = deepCopy(state);
      new_state[action.serverName].graphs[action.graphName] = {
        name : action.graphName
      }
      storage.set('servers', new_state);
      return new_state;
    }
    case actions.LOAD_STATE: {
      return action.new_state;
      break;
    }
  }
  return state;
}
