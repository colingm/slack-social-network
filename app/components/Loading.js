// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TrafficLights from './TrafficLights';
import styles from './Loading.css';
import loading from '../static/loading.gif';
import storage from 'electron-json-storage';
import axios from 'axios';
import { loadServersIfNeeded, 
         loadServersListIfNeeded,
         loadServerProgressIfNeeded } from '../actions/servers.js'

const SERVER_LIST_URL = 'http://35.226.139.18:8080/api/v1/teams';

export default class Loading extends Component {

  render() {
    this.props.dispatch(loadServersIfNeeded());
    this.props.dispatch(loadServersListIfNeeded());
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
