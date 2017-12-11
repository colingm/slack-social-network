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

  onCreateGraph = (graphName: string, type: string, channelID: string, mentions: string, users: string) => {
    this.props.addGraph(graphName, type, channelID, mentions, users);
    this.props.selectGraph(graphName);
  }

  render = () => {
    const { server } = this.props;
    const serverLink = "/main/servers/"+server.id;
    return (
      <Switch>
        <Route path={serverLink+"/graphs/:graph"} render={this.renderGraph} />
        <Route path={serverLink+"/addGraph"} render={() => (
          <AddGraph onCreate={this.onCreateGraph} domain={this.props.server.domain}/>
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

  componentWillReceiveProps = (nextProps) => {
    this.props = nextProps;
    this.reloadData();
  }

  componentDidMount = () => {
    window.addEventListener('resizeend', this.resize);

    this.reloadData();
  }

  componentWillUnmount = () => {
    window.addEventListener('resizeend', this.resize);
  }

  componentDidUpdate = () => {
    this.createForceGraph(this.state.data);
  }

  reloadData = () => {
    this.setState({ isLoading: true });

    let domain = this.props.domain;
    let channelID = this.props.channelID;
    let threshold = this.props.threshold;
    let limit = this.props.limit;
    let type = this.props.graphType;
    if (type == "mentions") {
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
      .catch((error) => this.setState({ error, isLoading: false }));
    } else {
      let url = `${API_URL}/${domain}/users?limit=${limit}`;
      fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Something went wrong...');
        }
      })
      .then((users) => {
        url = `${API_URL}/${domain}/channels`;
        fetch(url)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Something went wrong...');
          }
        })
        .then((channels) => {
          let links = [];
          let nodes = {};
          for (let channel of channels) {
            nodes[channel.channelID] = {id: channel.channelID, name: channel.name, relations: 0, type: 'channel'};
          }

          for (let user of users) {
            nodes[user.name] = {id: user.name, relations: 1};
            for (let channel of user.channels) {
              links.push({source: channel, target: user.name});
              nodes[channel].relations++;
            }
          }

          let data = {nodes: Object.values(nodes), links};
          this.createForceGraph(data);
          this.setState({data, isLoading: false});
        });
      })
      .catch((error) => this.setState({ error, isLoading: false }));
    }

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

    var svg = d3.select(me)
      .call(d3.zoom().on("zoom", () => { svg.attr("transform", d3.event.transform); }))
      .append("g");
    let width = me.clientWidth;
    let height = me.clientHeight;

    var linkedByIndex = {};
    data.links.forEach(function(d) {
      if (d.source instanceof String) {
        linkedByIndex[d.source + "," + d.target] = true;
      } else {
        linkedByIndex[d.source.id + "," + d.target.id] = true;
      }
    });

    function isConnected(a, b, type) {

      let result = linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || ((type == "text" || type == "node") && a.index == b.index)
        ||  linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id]
        || (b.source && b.target.id == a.id && (linkedByIndex[a.id + "," + b.source.id] || linkedByIndex[b.source.id + "," + a.id]))
        || (b.target && b.source.id == a.id && (linkedByIndex[a.id + "," + b.target.id] || linkedByIndex[b.target.id + "," + a.id]));

      return result;
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
      .attr("stroke-width", (d) => d.mentions ? Math.sqrt(d.mentions) : 2);

    var node = svg.append("g")
      .attr("class", d3_styles.nodes)
      .selectAll("circle") //will soon exist
      .data(data.nodes) //statements past here executed once per data point
      .enter() //creates and hands off placeholder element
      .append("circle") // adds circle to placeholder element received from enter()
      .attr("r", (d) => (Math.sqrt(d.relations) * 7) + 5)
      .attr("fill", (d) => d.type == 'channel' ? "cyan" : "orange")
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
      .text((d) => d.name ? d.name : d.id)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-family", "Arial")
      .attr("dy", ".35em")
  	  .style("font-size", nominalTextSize + "px");

    var mentions = svg.append("g").selectAll("g")
      .data(data.links)
      .enter().append("g")
      .append("text")
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-family", "Arial")
      .style("font-size", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.mentions; });

    node
      .on("mouseover", (d) => setHighlight(d) )
      .on("mouseout", (d) => exitHighlight(d) );

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
          node.style("opacity", 1);
          text.style("opacity", 1);
          link.style("opacity", 1);
          mentions.style("opacity", 1);
        }
      }

      if (highlightNode == null) exitHighlight();
    }

    function setFocus(d) {
      if (highlightTrans < 1) {
        node.style("opacity", (o) => isConnected(d, o, "node") ? 1 : highlightTrans );
        text.style("opacity", (o) =>  isConnected(d, o, "text") ? 1 : highlightTrans );
        mentions.style("opacity", (o) =>  isConnected(d, o, "mentions") ? 1 : highlightTrans );
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
  		  node.style(toWhite, (o) => isConnected(d, o, "node") ? highlightColor : "white" );
  			text.style("font-weight", (o) => isConnected(d, o, "text") ? "bold" : "normal" );
        mentions.style("font-weight", (o) => isConnected(d, o, "mentions") ? "bold" : "normal");
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
      	  node.style(toWhite, "white");
      	  text.style("font-weight", "normal");
      	  mentions.style("font-weight", "normal");
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

      text
        // set node label positioning such that ids float above the circles
        .attr("x", function(d){ return d.x; })
        .attr("y", function (d) {return d.y-12; });

      mentions
        .attr("x", function(d){ return (d.source.x + d.target.x)/2; })
        .attr("y", function (d) {return (d.source.y + d.target.y)/2; });
    }
  }

  render() {
    const { data, isLoading, error } = this.state;

    if (error) {
      return <p ref={node => this.node = node}>{error.message}</p>;
    } else if (isLoading) {
      return <p ref={node => this.node = node}>Loading...</p>;
    }

    return (
      <svg className={styles.svg} ref={node => this.node = node}></svg>
    );
  }

}

export class ViewGraph extends Component {
  render = () => {

    const { graph, domain } = this.props;
    const type = graph.type;
    const channelID = graph.channelID;
    const threshold = graph.mentions;
    const userLimit = graph.users;
    return (
      <div className={styles.fullHeight}>
        <div className={styles.fullHeight}>
          {
            type == 'mentions' ? <ForceGraph domain={domain} type="mentions" channelID={channelID} threshold={threshold}/> : null
          }
          {
            type == 'channels' ? <ForceGraph domain={domain} type="channels" limit={userLimit} /> : null
          }
          {/* <ForceGraph domain={domain} channelID={channelID} threshold={threshold}/> */}
        </div>
      </div>
    );
  }
}

class AddGraph extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      type: "mentions",
      channel: "",
      mentions: "",
      users: "",
      channels: [],
      isLoading: false,
      error: null
    };
  }

  componentDidMount = () => {
    this.setState({isLoading: true});

    let domain = this.props.domain;
    let url = `${API_URL}/${domain}/channels`;
    fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong...');
      }
    })
    .then((channels) => {
      this.setState({ channels, isLoading: false });
    })
    .catch((error) => this.setState({ error, isLoading: false }))
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
      users: "",
      channels: [],
      isLoading: false,
      error: null
    });

    this.props.onCreate(name, type, channel, mentions, users);
  }

  render = () => {
    const { handleClick, handleNameChange, handleTypeSelect, handleMentionsChange,  handleUserCountChange, handleChannelSelect } = this;
    let { name, type, channel, mentions, users, channels, isLoading, error } = this.state;

    let channelPrompt = "Loading channels...";
    if (error) {
      channelPrompt = error.message;
    } else if (!isLoading) {
      channelPrompt = "Select a Channel";
    }
    let channelSelect = channels.map((item) => {
      return (
        <option key={item.channelID} value={item.channelID}>{item.name}</option>
      );
    });

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
            <select className="form-control" defaultValue="" onChange={handleChannelSelect}>
              <option value="" disabled>{channelPrompt}</option>
              {channelSelect}
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
