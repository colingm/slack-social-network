// @flow
import React, { Component } from 'react';
import { NavLink, Switch, Redirect, Route } from 'react-router-dom';
let d3 = require('d3');
import uuid from 'uuid/v4';
import styles from './Graph.css';
import d3_styles from './d3.css';

var TIMEOUT = 200,
    EVENT_KEY = 'resizeend',
    timer;
window.addEventListener('resize', function () {
    clearTimeout(timer);

    timer = setTimeout(function () {
        var e = new Event(EVENT_KEY);
        window.dispatchEvent(e);
    }, TIMEOUT);
});

export class GraphRouter extends Component {
  renderGraph = ({match}) => {
    const { server } = this.props;
    const graphs = server.graphs;
    if (match.params.graph in graphs) {
      return (<ViewGraph graph={server.graphs[match.params.graph]} />);
    } else {
      return (<Redirect to={"/main/servers/"+server.id+"/graphs"} />);
    }
  }

  defaultRender = () => {
    const { server } = this.props;
    const graphs = server.graphs;
    const serverLink = "/main/servers/"+server.id;
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
    const serverLink = "/main/servers/"+server.id;
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

class ForceGraph extends Component {

  resize = () => {
    this.forceUpdate();
  }

  componentDidMount = () => {
    window.addEventListener('resizeend', this.resize);
    this.createForceGraph();
  }

  componentWillUnmount = () => {
    window.addEventListener('resizeend', this.resize);
  }

  componentDidUpdate = () => {
    this.createForceGraph();
  }

  createForceGraph = () => {
    const me = this.node;
    const data = this.props.data;

    var svg = d3.select(me);
    let width = me.clientWidth;
    let height = me.clientHeight;

    svg.selectAll("*").remove();
    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(function(d) { return d.id; }))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    var link = svg.selectAll(".link")
      .data(data.links)
    .enter().append("line")
      .attr("class", d3_styles.link)
      .attr("stroke-width", function(d) { return Math.sqrt(d.mentions); });

    var node = svg.append("g")
        .attr("class", d3_styles.nodes)
      .selectAll("circle") //will soon exist
      .data(data.nodes) //statements past here executed once per data point
      .enter() //creates and hands off placeholder element
        .append("circle") // adds circle to placeholder element received from enter()
        .attr("r", 10)
        .attr("fill", "orange")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
      .text(function(d) { return d.id; });

    simulation
      .nodes(data.nodes)
      .on("tick", ticked);

    simulation.force("link")
      .links(data.links);

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function ticked() {
      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

      node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    }
  }

  render() {
    return (
      <svg className={styles.svg} ref={node => this.node = node}></svg>
    );
  }
}

var force_graph_data = {
  "nodes": [
    {"id": "Abe"},
    {"id": "Bob"},
    {"id": "Conrad"},
    {"id": "Don"},
    {"id": "Eric"},
    {"id": "Faith"},
    {"id": "Garret"},
    {"id": "Hilbert"},
    {"id": "Ivan"}
  ],
  "links": [
    {"source": "Abe", "target": "Bob", "mentions": 7},
    {"source": "Abe", "target": "Ivan", "mentions": 9},
    {"source": "Abe", "target": "Conrad", "mentions": 100},
    {"source": "Abe", "target": "Don", "mentions": 60},
    {"source": "Don", "target": "Conrad", "mentions": 1},
    {"source": "Don", "target": "Eric", "mentions": 7},
    {"source": "Eric", "target": "Faith", "mentions": 55},
    {"source": "Eric", "target": "Garret", "mentions": 16},
    {"source": "Eric", "target": "Hilbert", "mentions": 82}
  ]
};

export class ViewGraph extends Component {
  render = () => {
    const { graph } = this.props;
    return (
      <div className={styles.fullHeight}>
        Viewing: {graph.name}
        <div className={styles.fullHeight}>
          <ForceGraph data={force_graph_data} />
        </div>
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
    const serverLink = "/main/servers/"+this.props.server.id;
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
