import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { GraphRouter } from '../components/Graph';
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

function mapStateToProps(state, {server}) {
  return {
    server: server,
  };
}

function mapDispatchToProps(dispatch, {server}) {
  return {
    addGraph: (graphName: string) => {
      dispatch({
        type: actions.ADD_GRAPH,
        serverId: server.id,
        graphName: graphName
      });
    },
    selectGraph: (graphName: string) => {
      return dispatch(push("/main/servers/"+server.id+"/graphs/"+graphName));
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GraphRouter));
