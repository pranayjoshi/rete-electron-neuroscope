export const FeatureExtractor = class {
  constructor(sample_rate = 256, lowFreq = 7, highFreq = 20, filterOrder = 128, buffer_size = 10) {
    this.bci = window.bci;
    let Fili = window.fili;
    this.sampleRate = sample_rate;
    this.lowFreq = lowFreq;
    this.highFreq = highFreq;
    this.filterOrder = filterOrder;
    this.firCalculator = new Fili.FirCoeffs();
    this.coeffs = this.firCalculator.bandpass({
      order: this.filterOrder,
      Fs: this.sampleRate,
      F1: this.lowFreq,
      F2: this.highFreq
    });

    this.filter = new Fili.FirFilter(this.coeffs);
    this.buffer_size = buffer_size;
    this.buffer = {};
    //console.log(this.bci)
    //console.log(this.filter)
  }

  getBandPower(channel, band) {
    if (!channel) return;
    this.filter.simulate(channel);
    let psd = window.bci.signal.getPSD(this.sampleRate, channel);
    psd.shift();
    let bp = window.bci.signal.getBandPower(channel.length, psd, this.sampleRate, band);
    return { psd, bp };
  }

  getRelativeBandPower(channel, band) {
    if (!channel) return;
    var target = this.getBandPower(channel, band).bp;
    var delta = this.getBandPower(channel, "delta").bp;
    var theta = this.getBandPower(channel, "theta").bp;
    var alpha = this.getBandPower(channel, "alpha").bp;
    var beta = this.getBandPower(channel, "beta").bp;
    var gamma = this.getBandPower(channel, "gamma").bp;
    //console.log({delta, theta, alpha, beta, gamma})
    return target / (delta + theta + alpha + beta + gamma);
  }

  getBetaOverDelta(channel) {
    if (!channel) return;
    return this.getBandPower(channel, "beta").bp / this.getBandPower(channel, "delta").bp;
  }

  getAverage(array) {
    if (array.length > 0) return array.reduce((a, b) => a + b) / array.length;
  }

  updateBuffer(feature, sample) {
    if (!this.buffer[feature]) {
      this.buffer[feature] = [];
    }

    //console.log(this.buffer[feature])
    if (this.buffer[feature].length >= this.buffer_size) {
      this.buffer[feature].shift();
      this.buffer[feature].push(sample);
      //console.log(this.buffer)
      return this.getAverage(this.buffer[feature]);
    } else {
      this.buffer[feature].push(sample);
      return 0;
    }
  }

  getAverageRelativeBandPower(channels, band) {
    let features = [];
    for (let i in channels) {
      let feature = this.getRelativeBandPower(channels[i], band);
      features.push(feature);
    }
    let avg = this.getAverage(features);
    return avg ? avg : 0;
  }

  getFormattedBandPowers(channels) {
    return {
      delta: this.getAverageRelativeBandPower(channels, "delta") * 100,
      theta: this.getAverageRelativeBandPower(channels, "theta") * 100,
      alpha: this.getAverageRelativeBandPower(channels, "alpha") * 100,
      beta: this.getAverageRelativeBandPower(channels, "beta") * 100,
      gamma: this.getAverageRelativeBandPower(channels, "gamma") * 100
    };
  }

  getAverageBetaOverDeltaPower(channels) {
    let features = [];
    for (let i in channels) {
      let feature = this.getBetaOverDelta(channels[i]);
      features.push(feature);
    }
    let avg = this.getAverage(features);
    return avg ? avg : 0;
  }
};
