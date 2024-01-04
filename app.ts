import Homey from 'homey';
import Switcher from 'switcher-js2';

export default class SwitcherApp extends Homey.App {
    #proxy: any;
    switchers: any;

    async onInit() {
        this.#proxy = Switcher.listen(() => {});
        this.switchers = {};

        this.#proxy.on('message', message => {
            const id = message.device_id;
            this.switchers[id] = message;
            this.emit(`state.${id}`, message.state);
        });
    }

    async onUninit() {
        this.#proxy.close();
    }
}

module.exports = SwitcherApp;