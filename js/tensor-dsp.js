//import { Series } from dfd

export const TensorDSP = class {
  constructor(device_type, buffer_size=256) {
    this.device_type = device_type;
    this.df = null;
    this.tf = dfd.tensorflow;
    this.real_time_tensor = null;
    this.offline_tensor = null;
    this.buffer_size = buffer_size
    this.device_map = {
        "muse": {
            "channels": 4,
            "sampling_rate": 256
        }
    }
    this.init();
  }

  init() {
    switch (this.device_type) {
      case "muse":
        this.init_muse_dataframe();
        break;
      default:
        console.error("TensorDSP: Device type not defined");
        break;
    }
  }

  print_tensor(tensor) {
    let s = new dfd.Series(tensor);
    s.print();
  }

  shift_tensor_realtime() {
    this.real_time_tensor = this.tf.slice(this.real_time_tensor, [1, 0]);
  }

  push_tensor_realtime(new_data) {
    this.real_time_tensor = this.real_time_tensor.concat(this.tf.tensor2d([new_data]), 0);
  }

  print_real_time_data() {
    this.print_tensor(this.real_time_tensor)
  }

  get_real_time_tensor_shape() {
    return this.real_time_tensor.shape
  }

  get_device_info() {
    return this.device_map[this.device_type]
  }

  get_buffer_size() {
    return this.get_real_time_tensor_shape()[0]
  }

  add_data(data){
    if (this.get_buffer_size() < this.buffer_size) {
      this.push_tensor_realtime(data)
    } else {
      // slice
      // push
    }
  }

  init_muse_dataframe() {
    console.log("init muse");
    let channel_count = this.get_device_info().channels
    this.real_time_tensor  = this.tf.zeros([1, channel_count])
    console.log(this.get_buffer_size())
  }
};
