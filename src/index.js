const Rete = require('rete');
const ConnectionPlugin = require('rete-connection-plugin').default;
const VueRenderPlugin = require('rete-vue-render-plugin').default;

(async () => {
    const container = document.querySelector('#rete');

    const components = [];

    const editor = new Rete.NodeEditor('demo@0.1.0', container);
    editor.use(ConnectionPlugin);
    editor.use(VueRenderPlugin);

    const engine = new Rete.Engine('demo@0.1.0');

    components.forEach(c => {
        editor.register(c);
        engine.register(c);
    });

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        console.log('process');
        await engine.abort();
        await engine.process(editor.toJSON());
    });

    editor.view.resize();
    editor.trigger('process');
    AreaPlugin.zoomAt(editor);
})();
