import Homey from 'homey';
import Switcher from 'switcher-js2';

module.exports = class SwitcherApp extends Homey.App {
    async onInit() {
        const listen = Switcher.listen(() => {});

        listen.on('message', message => {
            const { state, ...device } = message;
            const id = device.device_id;
            const devices = this.homey.settings.get('devices') ?? {};

            devices[id] = device;
            this.homey.settings.set('devices', devices);
            this.emit(`state.${id}`, state);
        });
    }
}