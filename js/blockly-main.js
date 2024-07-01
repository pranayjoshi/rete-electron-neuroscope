import * as Blockly from "blockly/core";
import locale from "blockly/msg/en";
import * as libraryBlocks from "blockly/blocks";
import { javascriptGenerator, Order } from "blockly/javascript";
import { createCustomBlocks } from "./customblock.js";
import { Categories } from "./categories.js";
import { Toolbox, unwind } from "./Toolbox.js";
import Interpreter from "js-interpreter";
import { InterpreterAPI } from "./interpreter-api.js";

Blockly.setLocale(locale);
let { cat_logic, cat_loops, cat_math, cat_sep, cat_data, cat_drone } = Categories;

export const BlocklyMain = class {
  constructor() {
    createCustomBlocks();
    this.interpreter = null;
    this.runner = null; // may need to use window here
    this.latestCode = "";

    let _toolbox = new Toolbox([cat_logic, cat_loops, cat_math, cat_sep, cat_data, cat_drone]);

    this.workspace = Blockly.inject("blocklyDiv", {
      toolbox: _toolbox.toString()
    });

    this.registerCustomToolbox();
  }

  createCustomToolBox = (blocks) => {
    let res = [];
    blocks.forEach((element) => {
      let block = unwind([element], true);
      block = Blockly.utils.xml.textToDom(block).firstChild;
      res.push(block);
    });
    return res;
  };

  download() {
    //let filename = prompt();
    let filename = "test";
    filename = `${filename}.xml`;

    let as_dom = Blockly.Xml.workspaceToDom(this.workspace);
    let as_text = Blockly.Xml.domToText(as_dom);

    var element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(as_text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  resetInterpreter = () => {
    this.interpreter = null;
    this.workspace.highlightBlock(null);
    if (this.runner) {
      clearTimeout(this.runner);
      this.runner = null;
    }
  };

  executeCode = () => {
    console.log("latest Code: ", this.latestCode);
    this.workspace.highlightBlock(null);

    let interpreterApi = new InterpreterAPI(this.workspace);

    // For text-based code example see previous projects such as our work published at HRI
    this.interpreter = new Interpreter(this.latestCode, interpreterApi.init.bind(interpreterApi));

    this.runner = function () {
      //console.log(this.interpreter);

      // If no interpreter do not run
      if (!this.interpreter) return;

      var hasMore = this.interpreter.step();

      // If the interpreter is still running keep going
      if (hasMore) {
        setTimeout(this.runner.bind(this), 1);
      } else {
        this.resetInterpreter();
      }
    };

    try {
      this.runner();
    } catch (error) {
      return error;
    }
  };

  generateLatestCode = () => {
    javascriptGenerator.STATEMENT_PREFIX = "highlightBlock(%1);\n";
    javascriptGenerator.addReservedWords("highlightBlock");
    this.setLatestCode(javascriptGenerator.workspaceToCode(this.workspace));
    //console.log(this.latestCode);
  };

  runCode = () => {
    if (this.interpreter == null) {
      this.executeCode();
    }
  };

  registerCustomToolbox = () => {
    // Triggers everytime category opens
    this.workspace.registerToolboxCategoryCallback("DATA", (ws) => {
      return this.createCustomToolBox(["filter_signal"]);
    });
  };

  setLatestCode = (code) => {
    this.latestCode = code;
  };

  stop = () => {
    this.resetInterpreter();
  };

  start = () => {
    this.generateLatestCode();

    let eventListener = (event) => {
      if (event.type !== Blockly.Events.Ui) {
        this.resetInterpreter();
        this.generateLatestCode();
      }
    };

    this.workspace.addChangeListener(eventListener);
  };
};
