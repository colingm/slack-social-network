// @flow
import React, { Component } from 'react';
import { NavLink, Switch, Redirect, Route } from 'react-router-dom';
import uuid from 'uuid/v4';
import styles from './Graph.css';

export class GraphRouter extends Component {
  renderGraph = ({match}) => {
    const { server } = this.props;
    const graphs = server.graphs;
    if (match.params.graph in graphs) {
      return (<ViewGraph graph={server.graphs[match.params.graph]} />);
    } else {
      return (<Redirect to={"/main/servers/"+server.name+"/graphs"} />);
    }
  }

  defaultRender = () => {
    const { server } = this.props;
    const graphs = server.graphs;
    const serverLink = "/main/servers/"+server.name;
    if (Object.keys(graphs).length == 0) {
      return (
        <Redirect to={serverLink+"/addGraph"} />
      )
    }
    else {
      return (
        <Redirect to={serverLink+"/graphs/"+Object.keys(graphs)[0]} />
      );
    }
  }

  onCreateGraph = (graphName: string) => {
    this.props.addGraph(graphName);
    this.props.selectGraph(graphName);
  }

  render = () => {
    const { server } = this.props;
    const serverLink = "/main/servers/"+server.name;
    return (
      <Switch>
        <Route path={serverLink+"/graphs/:graph"} render={this.renderGraph} />
        <Route path={serverLink+"/addGraph"} render={() => (
          <AddGraph onCreate={this.onCreateGraph} />
        )} />
        <Route render={this.defaultRender} />
      </Switch>
    );
  }
}

export class ViewGraph extends Component {
  render = () => {
    const { graph } = this.props;
    return (
      <div>
        Viewing: {graph.name}
      </div>
    );
  }
}

class AddGraph extends Component {
  state = {
    value: ""
  };

  handleChange = (e) => {
    this.setState({value: e.target.value});
  };

  handleClick = (e) => {
    const value = this.state.value;
    this.setState({value: ""});
    this.props.onCreate(value);
  }

  render = () => {
    const { handleClick, handleChange } = this;
    let { value } = this.state;
    return (
      <div>
        <input type="text" className="form-control" onChange={handleChange} placeholder="Graph Name" value={value} />
        <button className="btn btn-primary" onClick={handleClick}>Add</button>
      </div>
    )
  }
}

export class GraphList extends Component {
  render = () => {
    let graphList = []
    const { graphs } = this.props.server;
    const serverLink = "/main/servers/"+this.props.server.name;
    for (let i in graphs) {
      graphList.push(
        <li key={uuid()} className={styles.graphNavLink}>
          <NavLink to={serverLink+"/graphs/"+graphs[i].name} activeClassName={styles.graphNavLinkActive}>
            {graphs[i].name}
          </NavLink>
        </li>
      );
    }
    graphList.push(
      <li key={uuid()} className={styles.graphNavAdd}>
        <NavLink to={serverLink+"/addGraph"}>
          <i className="fa fa-plus-circle" aria-hidden="true"></i>
        </NavLink>
      </li>
    )

    return (
      <ul id={styles.graphNav} className="list-inline">
        {graphList}
      </ul>
    );
  }
}
