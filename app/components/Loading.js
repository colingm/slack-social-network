// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import TrafficLights from './TrafficLights';
import styles from './Loading.css';
import loading from '../static/loading.gif';
import storage from 'electron-json-storage';

export default class Loading extends Component {

  constructor(props) {
    super(props);

    setTimeout(() => {
      storage.get('servers', (error, data) => {
        console.log(data);
        props.loadState(data);
      });
    }, 3000);
    this.render.bind(this);
  }

  render() {
    return (
      <div id={styles.main} >
        <TrafficLights />
        <div id={styles.loadingContainer}>
          <img id={styles.loading} src={loading} />
        </div>
      </div>
    );
  }
}
