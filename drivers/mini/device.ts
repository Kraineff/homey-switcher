import Homey from 'homey';
import Switcher from 'switcher-js2';

module.exports = class SwitcherMiniDevice extends Homey.Device {
    private _id!: string;
    private _switcher!: Switcher;

    async onInit() {
        this._id = this.getData().id;
        const device = this.homey.settings.get('devices')[this._id];
        this._switcher = new Switcher(device.device_id, device.device_ip, () => {}, false, device.type);

        this._initCapabilities();
        this.homey.app.addListener(`state.${this._id}`, this._handleState);
    }

    async onDeleted() {
        this._switcher.close();
        this.homey.app.removeListener(`state.${this._id}`, this._handleState);

        const devices = this.homey.settings.get('devices');
        delete devices[this._id];
        this.homey.settings.set('devices', devices);
    }

    private _initCapabilities() {
        this.registerCapabilityListener('onoff', (state, options) => {
            const duration = options.duration !== undefined &&
                Math.max(1, Math.min(options.duration / (60 * 1000), 24 * 60));
            
            state ? this._switcher.turn_on(duration) : this._switcher.turn_off();
        });
    }

    private _handleState = async state => {
        this.getCapabilityValue('onoff') !== !!state.power &&
            await this.setCapabilityValue('onoff', !!state.power);
        
        this.getCapabilityValue('measure_power') !== state.power_consumption &&
            await this.setCapabilityValue('measure_power', state.power_consumption);

        const minutes = state.default_shutdown_seconds / 60;
        this.setSettings({ default_shutdown: Math.trunc(minutes / 60) + ':' + minutes % 60 });
    };

    async onSettings({ newSettings, changedKeys }) {
        if (changedKeys.includes('default_shutdown')) {
            const time = newSettings.default_shutdown.split(':');
            const hours = Math.min(Math.max(0, +time[0]), 23) * 60 * 60;
            const minutes = Math.min(Math.max(0, +time[1]), 59) * 60;
            this._switcher.set_default_shutdown(hours + minutes);
        }
    }
}