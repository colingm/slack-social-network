import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push, replace, go } from 'react-router-redux';
import { deepCopy } from '../util';
import { actions } from '../reducers/servers';
import Loading from '../components/Loading';
import storage from 'electron-json-storage';


function mapDispatchToProps(dispatch) {
  return {
    loadState: (state) => {
      dispatch({
        type: actions.LOAD_STATE,
        new_state: state
      });
      dispatch(replace("/main"));
    }
  }
}

export default connect(null, mapDispatchToProps)(Loading);
