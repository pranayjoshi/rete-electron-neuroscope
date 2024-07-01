export const BandPowerLineGraph = function(element_id, band_id, time_interval){

    let graph = new Rickshaw.Graph( {
        element: document.getElementById(element_id),
        width: document.getElementById(element_id).clientWidth,
        height: 100,
        renderer: 'line',
        series: new Rickshaw.Series.FixedDuration([{ name: band_id }], undefined, {
            timeInterval: time_interval,
            maxDataPoints: 100,
            timeBase: new Date().getTime() / 1000
        }) 
    } );

    
    
    /*
    let updateWidth = () => {
        let w =  document.querySelector(`#${element_id}`).clientWidth
        graph.width = w
        console.log(w)
    }

    window.onresize = updateWidth
    */
    

    return graph
}