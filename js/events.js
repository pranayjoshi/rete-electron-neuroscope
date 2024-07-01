//import { SessionLineGraph } from "./session.js";
//import { BlocklyMain } from "./blockly-main.js";
import * as Blockly from "blockly/core";

export const Events = class {
  constructor(blockly) {
    this.blockly = blockly;
    this.session_graph = {};

    /* Blockly Events */

    this.create_event("run", this.execute_code.bind(this));
    this.create_event("saveFile", this.download_code.bind(this));
    this.load_input = this.eById("file_handler");

    let handleOnChangeUpload = (e) => {
      let file = e.target.files[0];
      if (!file) {
        return;
      }
      this.loadProject(file);
    };

    this.load_input.onchange = handleOnChangeUpload.bind(this);

    this.create_event("uploadFile", () => {
      console.log("upload");
      this.load_input.click();
    });

    this.create_event("stopButton", this.stop_program.bind(this));

    window.electronAPI.getDroneState((event, drone_state) => {
      console.log(drone_state);
      if (drone_state.bat) {
        document.getElementById("battery").innerHTML = drone_state.bat + "%";
      }
    });

    // Local store
    //this.create_event("start_local_store", this.start_local_store.bind(this));
    //this.create_event("drone_takeoff", this.takeoff_drone.bind(this));
    //this.create_event("drone_up", this.drone_up.bind(this));
    //this.create_event("drone_down", this.drone_down.bind(this));
    //this.create_event("drone_land", this.drone_land.bind(this));
  }

  eById = (id) => {
    let res = document.getElementById(id);
    if (res == null) throw new Error("Could not find element with ID: " + id);
    return res;
  };

  create_event(id, _func) {
    document.getElementById(id).onclick = _func;
  }

  loadProject(file) {
    this.blockly.workspace.clear();
    this.blockly.workspace.clearUndo();

    let reader = new FileReader();

    reader.onload = (e) => {
      let contents = e.target.result.toString();
      let as_xml = Blockly.utils.xml.textToDom(contents);
      Blockly.Xml.domToWorkspace(as_xml, this.blockly.workspace);
    };

    reader.readAsText(file);
  }

  stop_program() {
    this.blockly.stop();
    window.electronAPI.manualControl("land");
  }

  /* Blockly Events */
  execute_code() {
    this.blockly.runCode();
  }

  download_code() {
    this.blockly.download();
  }

  /* Drone events */

  takeoff_drone() {
    console.log("take off");
    window.electronAPI.manualControl("takeoff");
  }

  drone_up() {
    window.electronAPI.manualControl("up");
  }

  drone_down() {
    window.electronAPI.manualControl("down");
  }

  drone_land() {
    console.log("land");
    window.electronAPI.manualControl("land");
  }
};
