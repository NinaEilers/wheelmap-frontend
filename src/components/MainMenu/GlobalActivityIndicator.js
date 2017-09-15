// @flow
import debounce from 'lodash/debounce';
import { Dots } from 'react-activity';
import React, { Component } from 'react';
import { globalFetchManager } from '../../lib/FetchManager';

type State = {
  isShown: boolean;
}

export default class GlobalActivityIndicator extends Component<void, State> {
  state = { isShown: false };

  updateState = debounce(() => {
    this.setState({ isShown: globalFetchManager.isLoading() });
  }, 100);

  componentDidMount() {
    globalFetchManager.addEventListener('start', this.updateState);
    globalFetchManager.addEventListener('stop', this.updateState);
    globalFetchManager.addEventListener('error', this.updateState);
  }

  componentWillUnmount() {
    globalFetchManager.removeEventListener('start', this.updateState);
    globalFetchManager.removeEventListener('stop', this.updateState);
    globalFetchManager.removeEventListener('error', this.updateState);
  }

  render() {
    if (this.state.isShown) {
      return <Dots />;
    }
    return null;
  }
}
