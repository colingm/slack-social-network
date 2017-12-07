// @flow
import React, { Component } from 'react';
import type { Children } from 'react';
import LoadingPage from './LoadingPage.js';

export default class App extends Component {
  props: {
    children: Children
  };

  render = () => {
    return (
      <LoadingPage>
        {this.props.children}
      </LoadingPage>
    );
  }
}
