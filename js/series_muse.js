export const MuseSeries = function(max_data, time_interval){
    return new Rickshaw.Series.FixedDuration(
        [
            { name: 'TP9', color: 'steelblue' }, 
            { name: 'TP10', color: 'lightblue' }, 
            { name: 'AF7', color: 'gold' }, 
            { name: 'AF8', color: 'red' }
        ], 
        undefined,
        {
            timeInterval: time_interval,
            maxDataPoints: max_data,
            timeBase: new Date().getTime() / 1000
        }
    ) 
}
