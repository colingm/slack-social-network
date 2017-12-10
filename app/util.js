import axios from 'axios';

export function deepCopy(input) {
  return JSON.parse(JSON.stringify(input));
}

export class PeriodicRequest {
  constructor(url, params, delay, callback) {
    this.stop.bind(this);
    this._runner.bind(this);

    this.current_request = null;
    this.stopped = false;

    this.url = url;
    this.params = params;
    this.callback = callback;
  }

  start() {
    setInterval(() => this._runner(), this.delay);
  }

  stop() {
    clearTimeout(this.current_request);
    this.current_request = null;
  }

  _runner() {
    axios.get(this.url, this.params).then((response) => {
      let shouldStop = this.callback(response);
      if (shouldStop) {
        this.stop();
      }
    }).catch((error) => {
      console.log(error);
      this.stop();
    });
  }
}
