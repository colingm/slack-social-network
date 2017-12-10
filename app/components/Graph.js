// @flow
import React, { Component } from 'react';
import { NavLink, Switch, Redirect, Route } from 'react-router-dom';
let d3 = require('d3');
import uuid from 'uuid/v4';
import styles from './Graph.css';
import d3_styles from './d3.css';

const API_URL = 'http://35.226.139.18:8080/api/v1/teams';

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
    console.log(server);
    const graphs = server.graphs;
    if (match.params.graph in graphs) {
      return (<ViewGraph graph={server.graphs[match.params.graph]} domain={server.domain} />);
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
  constructor(props) {
    super(props);

    this.state = {
      data: {nodes: [], links: []},
      isLoading: false,
      error: null
    };
  }

  resize = () => {
    this.forceUpdate();
  }

  componentDidMount = () => {
    this.setState({ isLoading: true });

    window.addEventListener('resizeend', this.resize);

    let domain = this.props.domain;
    let channelID = this.props.channelID;
    let threshold = this.props.threshold;
    let url = `${API_URL}/${domain}/channels/${channelID}/mentions?threshold=${threshold}`;
    fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong...');
      }
    })
    .then((data) => {
      let links = [];
      let nodes = {};
      for (let rel of data) {
        if (!nodes[rel.user1]) {
          nodes[rel.user1] = {id: rel.user1, relations: 0};
        }
        if (!nodes[rel.user2]) {
          nodes[rel.user2] = {id: rel.user2, relations: 0};
        }
        nodes[rel.user1].relations++;
        nodes[rel.user2].relations++;
        links.push({source: rel.user1, target: rel.user2, mentions: rel.mentions});
      }
      data = {nodes: Object.values(nodes), links: links};
      this.createForceGraph(data);
      this.setState({ data, isLoading: false });
    })
    .catch((error) => this.setState({ error, isLoading: false }))
  }

  componentWillUnmount = () => {
    window.addEventListener('resizeend', this.resize);
  }

  componentDidUpdate = () => {
    this.createForceGraph(this.state.data);
  }

  createForceGraph = (data) => {

    if (!data) {
      data = this.state.data;
    }
    const me = this.node;


    var defaultNodeColor = "#ccc";
    var defaultLinkColor = "#aaaaaa";
    var highlightColor = "blue";
    var highlightTrans = 0.1;
    var toWhite = "stroke";
	  var toColor = "fill";
    var nominalBaseNodeSize = 8;
    var nominalTextSize = 10;
    var nominalStroke = 1.5;
    var focusNode = null,
        highlightNode = null;

    var svg = d3.select(me);
    let width = me.clientWidth;
    let height = me.clientHeight;

    var linkedByIndex = {};
    data.links.forEach(function(d) {
      linkedByIndex[d.source + "," + d.target] = true;
    });

    function isConnected(a, b) {
      return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

    svg.selectAll("*").remove();
    var simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id((d) => d.id ))
      .force("charge", d3.forceManyBody().strength((d) => -150 - d.relations * 50))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => d.radius + 5));

    var link = svg.selectAll(".link")
      .data(data.links)
      .enter().append("line")
      .attr("class", d3_styles.link)
      .style("stroke", defaultLinkColor)
      .attr("stroke-width", function(d) { return Math.sqrt(d.mentions); });

    var node = svg.append("g")
      .attr("class", d3_styles.nodes)
      .selectAll("circle") //will soon exist
      .data(data.nodes) //statements past here executed once per data point
      .enter() //creates and hands off placeholder element
      .append("circle") // adds circle to placeholder element received from enter()
      .attr("r", (d) => (d.relations * 1.5) + 8)
      .attr("fill", "orange")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    var circle = node.append("path")
      .style(toColor, (d) => defaultNodeColor )
      .style("stroke-width", nominalStroke)
      .style(toWhite, "white");

    var text = svg.selectAll(".text")
      .data(data.nodes)
      .enter().append("text")
      .attr("dy", ".35em")
  	  .style("font-size", nominalTextSize + "px")

    node
      .on("mouseover", (d) => setHighlight(d) )
      .on("mouseout", (d) => exitHighlight(d) );

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
      focusNode = d;
      setFocus(d)
      if (highlightNode === null) setHighlight(d);
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;

      if (focusNode !== null) {
        focusNode = null;
        if (highlightTrans < 1) {
          circle.style("opacity", 1);
          text.style("opacity", 1);
          link.style("opacity", 1);
        }
      }

      if (highlightNode == null) exitHighlight();
    }

    function setFocus(d) {
      if (highlightTrans < 1) {
        circle.style("opacity", (o) => isConnected(d, o) ? 1 : highlightTrans );
        text.style("opacity", (o) =>  isConnected(d, o) ? 1 : highlightTrans );
        link.style("opacity", (o) => o.source.index == d.index || o.target.index == d.index ? 1 : highlightTrans );
      }
    }

    function setHighlight(d) {
      svg.style("cursor","pointer");
    	if (focusNode !== null) {
        d = focusNode;
    	}

      highlightNode = d;

    	if (highlightColor != "white") {
  		  circle.style(toWhite, (o) => isConnected(d, o) ? highlightColor : "white" );
  			text.style("font-weight", (o) => isConnected(d, o) ? "bold" : "normal" );
        link.style("stroke", (o) => (o.source.index == d.index || o.target.index == d.index)
          ? highlightColor
          : defaultLinkColor );
    	}
    }

    function exitHighlight(d) {
      highlightNode = null;
    	if (focusNode === null) {
    		svg.style("cursor", "move");
    		if (highlightColor != "white") {
      	  circle.style(toWhite, "white");
      	  text.style("font-weight", "normal");
      	  link.style("stroke", (o) => defaultLinkColor );
        }
    	}
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
    const { data, isLoading, error } = this.state;

    if (error) {
      return <p ref={node => this.node = node}>{error.message}</p>;
    }

    if (isLoading) {
      return <p ref={node => this.node = node}>Loading...</p>;
    }

    return (
      <svg className={styles.svg} ref={node => this.node = node}></svg>
    );
  }

}

export class ViewGraph extends Component {
  render = () => {

    //TODO: REPLACE WITH ACTUAL DOMAIN, CHANNEL, AND THRESHOLD
    const { graph } = this.props;
      // const { graph, domain } = this.props;
      // const type = graph.type;
      // const channelID = graph.channelID;
      // const threshold = graph.mentions;
      // const userLimit = graph.users;
    let domain = "deepstream";
    let channelID = "C0G7QPGKS";
    let threshold = "5";
    console.log(domain, channelID, threshold);
    return (
      <div className={styles.fullHeight}>
        <div className={styles.fullHeight}>
          {/* {
            type == 'mentions' ? <ForceGraph domain={domain} channelID={channelID} threshold={threshold}/> : null
          }
          {
            type == 'channels' ? <ConceptMap domain={domain} limit={userLimit} /> : null
          } */}
          <ForceGraph domain={domain} channelID={channelID} threshold={threshold}/>
        </div>
      </div>
    );
  }
}

class AddGraph extends Component {
  state = {
    name: "",
    type: "mentions",
    channel: "",
    mentions: "",
    users: ""
  }

  handleNameChange = (e) => {
    this.setState({name: e.target.value});
  }

  handleMentionsChange = (e) => {
    this.setState({mentions: e.target.value});
  }

  handleUserCountChange = (e) => {
    this.setState({users: e.target.value});
  }

  handleTypeSelect = (e) => {
    this.setState({type: e.target.value});
  }

  handleChannelSelect = (e) => {
    this.setState({channel: e.target.value});
  }

  handleClick = (e) => {
    const { name, type, channel, mentions, users } = this.state;
    this.setState({
      name: "",
      type: "mentions",
      channel: "",
      mentions: "",
      users: ""
    });
    this.props.onCreate(name, type, channel, mentions, users);
  }

  render = () => {
    const { handleClick, handleNameChange, handleTypeSelect, handleMentionsChange,  handleUserCountChange } = this;
    let { name, type, channel, mentions, users } = this.state;
    return (
      <div>
        <input type="text" className="form-control" onChange={handleNameChange} placeholder="Graph Name" value={name} />
        <select className="form-control" onChange={handleTypeSelect}>
          <option value="mentions">User Mentions</option>
          <option value="channels">Channel Subscriptions</option>
        </select>
        {
          this.state.type == "mentions" ?
          <div>
            {/* TODO: FILL IN SELECT WITH CHANNELS */}
            <select className="form-control">

            </select>
            <input className="form-control" onChange={handleMentionsChange} placeholder="Minimum Mentions" value={mentions}/>
          </div> : null
        }
        {
          this.state.type == "channels" ?
          <input className="form-control" onChange={handleUserCountChange} placeholder="User Count" value={users}/> : null
        }
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
