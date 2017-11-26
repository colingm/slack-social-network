// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './TrafficLights.css';
import electron from 'electron';

export default class TrafficLights extends Component {
  thisWindow = electron.remote.getCurrentWindow();

  handleClose = (e) => {
    this.thisWindow.close();
  }

  handleMin = (e) => {
    this.thisWindow.minimize();
  }

  handleMax = (e) => {
    this.thisWindow.maximize();
  }

  render = () => {
    const { handleClose, handleMin, handleMax } = this;
    return (
      <div id={styles.traffic_lights} >
        <div className={styles.light} id={styles.close} onClick={handleClose}></div>
        <div className={styles.light} id={styles.minimize} onClick={handleMin}></div>
        <div className={styles.light} id={styles.maximize} onClick={handleMax}></div>
      </div>
    );
  }
}
