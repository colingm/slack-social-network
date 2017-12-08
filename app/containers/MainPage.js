import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import MainPage from '../components/MainPage';
import { actions } from '../reducers/servers';

const DEFAULT_ICON = "http://iosicongallery.com/img/512/slack-2014.png";

export function save(state) {
  storage.set('state', state);
}

let actionProps = {
  addServer: (id: number) => {
    return {
      type: actions.ADD_SERVER,
      id: id
    };
  },

  selectServer: (selected: number) => {
    return push("/main/servers/"+selected);
  }
}

function mapStateToProps(state) {
  let servers = {};
  for (let i = 0; i < Object.keys(state.servers).length; i++) {
    let id = Object.keys(state.servers)[i];
    let s_id = state.servers[id].id;
    let s_name = state.servers_list[s_id].name;
    let s_icon = state.servers_list[s_id].icon;
    if (Object.keys(s_icon).length == 0) {
      s_icon = DEFAULT_ICON;
    } else {
      s_icon = s_icon.image_230;
    }

    servers[s_id] = {
      id: s_id,
      icon: s_icon,
      name: s_name,
      isLoaded: state.servers[id].ready,
      progress: state.servers[id].progress,
      graphs: state.servers[id].graphs
    };
  }

  return {
    servers: servers,
    serversList: state.servers_list
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actionProps, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MainPage));
