import fili from "./fili.esm.js";

export const filterSignal = async function (y, low, cutoff, updateGraph = false) {
  console.log("filtering signal");
  const iirCalculator = new fili.CalcCascades();
  var iirFilterCoeffs = iirCalculator.lowpass({
    order: 3, // cascade 3 biquad filters (max: 12)
    characteristic: "butterworth",
    Fs: sampleFreq, // sampling frequency
    Fc: cutoff // cutoff frequency / center frequency for bandpass, bandstop, peak
  });

  const filter = new fili.IirFilter(iirFilterCoeffs);

  let signalFiltered = await filter.simulate(y);
  console.log(signalFiltered);

  return signalFiltered;
};
