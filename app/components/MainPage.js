// @flow
import React, { Component } from 'react';
import { Link, NavLink, Redirect, Route, Switch } from 'react-router-dom';
import TrafficLights from './TrafficLights.js'
import GraphRouter from '../containers/GraphPage.js'
import { GraphList } from './Graph.js'
import uuid from 'uuid/v4';
import styles from './MainPage.css';
import Autocomplete from 'react-autocomplete';
import { PeriodicRequest } from '../util.js'

class AddServer extends Component {
  state = {
    value: "",
    selected: null
  };

  handleChange = (e) => {
    let selected = this.props.serversList.findIndex((server) => {
      return server.domain == e.target.value;
    });

    this.setState({
      value: e.target.value,
      selected: selected
    });
  }

  handleSelect = (value, server) => {
    let selected = this.props.serversList.findIndex((server) => {
      return server.domain == value;
    });

    this.setState({
      value: server.domain,
      selected: selected
    });
  }

  handleClick = (e) => {
    this.props.onCreate(this.state.selected);
  }

  render = () => {
    const { handleClick, handleChange, handleSelect } = this;
    let { selected, value } = this.state;
    const { serversList } = this.props;
    return (
      <div>
        <div id={styles.topbar} className="row">
          <h2>Add Server</h2>
        </div>
        <div id={styles.content} className="row">
          <Autocomplete
            getItemValue={(server) => server.domain}
            shouldItemRender={(server, value) => {
                let domain = server.domain.toLowerCase()
                return domain.indexOf(value.toLowerCase()) > -1
            }}
            items={serversList}
            renderItem={(server, isHighlighted) =>
              <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                {server.domain}
              </div>
            }
            inputProps={{
              className: "form-control",
              placeholder: "Team name"
            }}
            value={value}
            onChange={handleChange}
            onSelect={handleSelect}
            selectOnBlur={true}
          />
          <button className="btn btn-primary" onClick={handleClick}
                  disabled={selected === -1}>
            Add
          </button>
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
    const { id, icon, isLoaded, progress } = this.props;
    if (true) {
      return (
        <div className={styles.serverButtonContainer}>
          <NavLink to={"/main/servers/"+id} activeClassName={styles.navLinkSelected}>
            <img src={icon} className={styles.serverButton} />
          </NavLink>
        </div>
      );
    } else {
      return (
        <div className={styles.serverButtonContainer}>
          <NavLink to={"/main/servers/"+id} activeClassName={styles.navLinkSelected}>
            {progress}
          </NavLink>
        </div>
      );
    }
  }
}

class Sidebar extends Component {
  render = () => {
    const { servers } = this.props;
    let buttons = []
    for (let id in servers) {
      let server = servers[id];
      buttons.push(<ViewServerButton
                    key={uuid()} id={server.id}
                    icon={server.icon} isLoaded={server.isLoaded} 
                    progress={server.progress} />);
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
    console.log(match.params.server);
    console.log(servers);
    if (match.params.server in servers) {
      return (<ViewServer server={servers[match.params.server]} />);
    } else {
      return (<Redirect to="/main/servers" />);
    }
  }

  render = () => {
    const { servers, serversList } = this.props;
    return (
      <div className={styles.wrapper}>
        <nav id={styles.sidebar}>
          <Sidebar servers={servers} />
        </nav>
        <div id={styles.main} className="container-fluid">
          <Switch>
            <Route path="/main/servers/:server" render={this.renderServer} />
            <Route path="/main/addServer" render={() => (
              <AddServer serversList={serversList} onCreate={this.onCreateServer} />
            )} />
            <Route render={this.renderDefaultRoute} />
          </Switch>
        </div>
      </div>
    )
  }
}

export default MainPage;
