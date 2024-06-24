// Define your node
class MyNode extends Rete.Component {
    constructor() {
        super("My Node");
    }

    builder(node) {
        var out = new Rete.Output('output', "Output", new Rete.Socket('Number'));
        return node.addOutput(out);
    }
}

// Create editor
async function initializeEditor() {
    var container = document.querySelector('#rete');
    var editor = new Rete.NodeEditor('demo@0.1.0', container);

    editor.use(ConnectionPlugin.default);
    editor.use(VueRenderPlugin.default);
    editor.use(AreaPlugin);

    var myNode = new MyNode();
    editor.register(myNode);

    // Add a node
    var node = await myNode.createNode();
    editor.addNode(node);

    editor.view.resize();
    editor.trigger('process');
}

initializeEditor().catch(console.error);