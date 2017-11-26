import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import MainPage from '../components/MainPage';
import { actions } from '../reducers/servers';

export function save(state) {
  storage.set('state', state);
}

let actionProps = {
  addServer: (name: string) => {
    return {
      type: actions.ADD_SERVER,
      name: name
    };
  },

  selectServer: (selected: string) => {
    return push("/main/servers/"+selected);
  }
}

function mapStateToProps(state) {
  return {
    servers: state.servers
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actionProps, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
