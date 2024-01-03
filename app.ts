import Homey from 'homey';
import Switcher from 'switcher-js2';

export default class SwitcherApp extends Homey.App {
    #proxy: any;
    devices: any;

    async onInit() {
        this.#proxy = Switcher.listen(() => {});
        this.devices = {};

        this.#proxy.on('message', message => {
            const { state, ...device } = message;
            const id = device.device_id;
            this.devices[id] = device;
            this.emit(`state.${id}`, state);
        });
    }

    async onUninit() {
        this.#proxy.close();
    }
}

module.exports = SwitcherApp;