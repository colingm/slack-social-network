// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TrafficLights from './TrafficLights';
import styles from './Loading.css';
import loading from '../static/loading.gif';
import storage from 'electron-json-storage';
import axios from 'axios';

const SERVER_LIST_URL = 'http://35.226.139.18:8080/api/v1/teams';

export default class Loading extends Component {

  constructor(props) {
    super(props);

    this.render.bind(this);

    if (!this.props.doneLoading) {
      storage.get('servers', (data, error) => {
        if (data === null) {
          data = {};
        }
        this.props.loadServers(data);
      });
      storage.get('servers_list', (data, error) => {
        if (!Array.isArray(data) || data.length == 0) {
          axios.get(SERVER_LIST_URL).then((response) => {
            this.props.loadServersList(response.data);
          }).catch((error) => {
            console.log(error);
          });
        } else {
          this.props.loadServersList(data);
        }
      });
    }
  }

  render() {
    if (!this.props.doneLoading) {
      return (
        <div id={styles.main} >
          <TrafficLights />
          <div id={styles.loadingContainer}>
            <img id={styles.loading} src={loading} />
          </div>
        </div>
      );
    } else {
      return (
        <div>
          {this.props.children}
        </div>
      )
    }
  }
}
