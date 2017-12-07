import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push, replace, go } from 'react-router-redux';
import { deepCopy } from '../util';
import { actions } from '../reducers/servers';
import Loading from '../components/Loading';


function mapDispatchToProps(dispatch) {
  return {
    loadServers: (state) => {
      dispatch({
        type: actions.LOAD_SERVERS,
        new_state: state
      });
    },
    loadServersList: (state) => {
      dispatch({
        type: actions.LOAD_SERVERS_LIST,
        new_state: state
      });
    }
  }
}

function mapStateToProps(state) {
  return {
    doneLoading: state.loading_status.servers_loaded &&
                 state.loading_status.servers_list_loaded
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Loading);
