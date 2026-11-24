// Kids Arcade: a SMALL Rex UI (Nov 24, point 9 "faster"): only the 7 parts the menus use.
// Same code as phaser3-rex-plugins 1.80.8's templates/ui/ui-plugin.js, with the other ~90 parts left out.
import ObjectFactory from 'phaser3-rex-plugins/templates/ui/ObjectFactory.js';
import 'phaser3-rex-plugins/templates/ui/roundrectangle/Factory.js';
import 'phaser3-rex-plugins/templates/ui/roundrectanglecanvas/Factory.js';
import 'phaser3-rex-plugins/templates/ui/sizer/Factory.js';
import 'phaser3-rex-plugins/templates/ui/fixwidthsizer/Factory.js';
import 'phaser3-rex-plugins/templates/ui/overlapsizer/Factory.js';
import 'phaser3-rex-plugins/templates/ui/scrollablepanel/Factory.js';
import 'phaser3-rex-plugins/templates/ui/slider/Factory.js';

class UIPlugin extends Phaser.Plugins.ScenePlugin {
    constructor(scene, pluginManager) {
        super(scene, pluginManager);
        this.add = new ObjectFactory(scene);
    }
    boot() { this.scene.events.on('destroy', this.destroy, this); }
    destroy() { this.add.destroy(); super.destroy(); }
}
window.rexuiplugin = UIPlugin;
