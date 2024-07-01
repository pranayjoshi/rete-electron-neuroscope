export const Data = class {
    constructor(device_type, electrodes, sample_freq) {
        this.device_type = device_type
        this.electrodes = electrodes
        this.sample_freq = sample_freq
        this.raw_data = {}
    }

    add_data(data) {
        let temp_channel = ""
        for (let i in data) {
            
            // First Sample
            if (!this.raw_data[i]) {
                this.raw_data[i] = []
                this.raw_data[i] = this.raw_data[i].concat(data[i])
               
            } else {
                this.raw_data[i] = this.raw_data[i].concat(data[i])
            }
            temp_channel = i
        }
        let total_samples = this.raw_data[temp_channel].length
        document.querySelector(`#samples`).innerHTML = `${total_samples/this.sample_freq}s`
    }
    
    clear_data() {
        this.raw_data = {}
    }

    get_data() {
        return this.raw_data
    }
}