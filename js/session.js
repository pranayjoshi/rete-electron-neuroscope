
import { MuseSeries } from "./series_muse.js";

export const SessionLineGraph = class {
    constructor(data, width, height, div_id, time_interval=1) {
        this.data = data
        this.width = width
        this.height = height
        let first_channel = Object.keys(this.data)[0]
        let max_data = this.data[first_channel].length
        this.graph = new Rickshaw.Graph({
            element: document.querySelector(`#${div_id}`), 
            width: width, 
            height: height, 
            renderer: 'line',
            series: MuseSeries(max_data, time_interval),
        });

        for (let i = 0; i < max_data; i++) {
            let sample = this.get_formatted_data(i)
            this.graph.series.addData(sample)
        }

        this.graph.render()
    }

    get_formatted_data(i) {
        return {
            TP9: this.data[0][i] + (this.height * .1), 
            TP10: this.data[1][i]+ (this.height * .2), 
            AF8: this.data[2][i] + (this.height * .3), 
            AF7: this.data[3][i] + (this.height * .4)
        }
    }
}