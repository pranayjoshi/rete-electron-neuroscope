/**
 * @class Toolbox
 *
 * A simple wrapper for Blockly's Toolbox
 */

export class Toolbox {
  constructor(modules) {
    this.modules = modules;
    //console.log(this.modules);
  }

  toString() {
    let res = '<xml style="display: none;">';
    res += unwind(this.modules);
    res += "</xml>";
    //console.log(res);
    return res
  }
}

export function unwind(arg, prepend_xml = false) {
  let res = prepend_xml ? "<xml>" : "";
  let cur;
  for (let obj of arg) {
    if (obj.modules) {
      // The argument is a category
      cur = obj;

      // Create the category header
      res += '<category name="' + cur.name + '" colour="' + cur.colour + '"';

      // Allow for custom category types
      if (cur.custom) {
        res += ' custom="' + cur.custom + '"';
      }

      res += ">";
      res += unwind(cur.modules);

      // Close the category
      res += "</category>";

    } else if (obj.callbackKey) {
      cur = what;
      res += `<button text="${cur.text}" callbackKey="${cur.callbackKey}"></button>`;
    
    } else if (obj.text) {
      // The argument is a label
      cur = obj;
      res += '<label text="' + cur.text + '"></label>';
    
    } else if (obj.gap !== undefined) {
      // The argument is a separator
      cur = obj;
      res += '<sep gap="' + cur.gap + '"></sep>';
    
    } else {
      // The argument is a block
      res += '<block type="' + obj + '"></block>';
    }
  }
  
  if (prepend_xml) res += "</xml>";
  return res
}
