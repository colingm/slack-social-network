// @flow
import React, { Component } from 'react';
import { Link, NavLink, Redirect, Route, Switch } from 'react-router-dom';
import TrafficLights from './TrafficLights.js'
import GraphRouter from '../containers/GraphPage.js'
import { GraphList } from './Graph.js'
import uuid from 'uuid/v4';
import styles from './MainPage.css';

class AddServer extends Component {
  state = {
    value: ""
  };

  handleChange = (e) => {
    this.setState({value: e.target.value});
  };

  handleClick = (e) => {
    const value = +this.state.value;
    this.setState({value: ""});
    this.props.onCreate(value);
  }

  render = () => {
    const { handleClick, handleChange } = this;
    let { value } = this.state;
    return (
      <div>
        <div id={styles.topbar} className="row">
          <h2>Add Server</h2>
        </div>
        <div id={styles.content} className="row">
          <input type="text" className="form-control" onChange={handleChange} placeholder="Server Name" value={value} />
          <button className="btn btn-primary" onClick={handleClick}>Add</button>
        </div>
      </div>
    )
  }
}

class AddServerButton extends Component {
  render = () => {
    return (
      <div className={styles.addButtonContainer}>
        <Link to="/main/addServer">
          <button className={styles.addButton}>
            <i className="fa fa-plus" aria-hidden="true"></i>
          </button>
        </Link>
      </div>
    )
  }
}

class ViewServerButton extends Component {
  render = () => {
    const { id, icon } = this.props;
    return (
      <div className={styles.serverButtonContainer}>
        <NavLink to={"/main/servers/"+id} activeClassName={styles.navLinkSelected}>
          <img src={icon} className={styles.serverButton} />
        </NavLink>
      </div>
    )
  }
}

class Sidebar extends Component {
  render = () => {
    const { servers } = this.props;
    let buttons = []
    for (let id in servers) {
      let server = servers[id];
      buttons.push(<ViewServerButton key={uuid()} id={server.id}
                                     icon={server.icon} />);
    }
    return (
      <div>
        <TrafficLights />
        <div>
          {buttons}
        </div>
        <AddServerButton />
      </div>
    );
  }
}

class ViewServer extends Component {
  render = () => {
    const { server } = this.props;
    return (
      <span>
        <div id={styles.topbar} className="row">
          <div className="container-fluid">
            <div id={styles.draggable} className="row">
              <h2>{server.name}</h2>
            </div>
            <div className="row">
              <GraphList server={server} />
            </div>
          </div>
        </div>
        <div id={styles.content} className="row">
          <GraphRouter server={server} />
        </div>
      </span>
    )
  }
}

class MainPage extends Component {
  onCreateServer = (name: number) => {
    this.props.addServer(name);
    this.props.selectServer(name);
  }

  renderDefaultRoute = () => {
    const servers = this.props.servers;
    if (Object.keys(servers).length == 0) {
      return (
        <Redirect to="/main/addServer" />
      )
    }
    else {
      return (
        <Redirect to={"/main/servers/"+Object.keys(servers)[0]} />
      );
    }
  }

  renderServer = ({match}) => {
    const { servers } = this.props;
    if (match.params.server in servers) {
      return (<ViewServer server={servers[match.params.server]} />);
    } else {
      return (<Redirect to="/main/servers" />);
    }
  }

  render = () => {
    const { servers } = this.props;
    return (
      <div className={styles.wrapper}>
        <nav id={styles.sidebar}>
          <Sidebar servers={servers} />
        </nav>
        <div id={styles.main} className="container-fluid">
          <Switch>
            <Route path="/main/servers/:server" render={this.renderServer} />
            <Route path="/main/addServer" render={() => (
              <AddServer onCreate={this.onCreateServer} />
            )} />
            <Route render={this.renderDefaultRoute} />
          </Switch>
        </div>
      </div>
    )
  }
}

export default MainPage;
