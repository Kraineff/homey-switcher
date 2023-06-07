import Homey from 'homey';
import Switcher from 'switcher-js2';

export default class SwitcherDevice extends Homey.Device {
    private _id!: string;
    private _switcher!: Switcher;

    async onInit() {
        this._id = this.getData().id;

        const devices = this.homey.settings.get('devices') ?? {};
        const device = devices[this._id];
        !device && await this.setUnavailable('Неизвестное устройство');

        this._switcher = new Switcher(device.device_id, device.device_ip, () => {}, false, device.type);
        this._registerCapabilities();
        this.homey.app.on(`switcher.${this._id}`, this._handleState);
    }

    async onDeleted() {
        const devices = this.homey.settings.get('devices') ?? {};
        delete devices[this._id];
        this.homey.settings.set('devices', devices);

        this._switcher.close();
        this.homey.app.off(`switcher.${this._id}`, this._handleState);
    }

    private _registerCapabilities() {
        this.hasCapability('onoff') && this.registerCapabilityListener('onoff', (state, options) => {
            const duration = options.duration !== undefined &&
                Math.min(Math.max(options.duration / (60 * 1000), 1), 24 * 60);

            state ? this._switcher.turn_on(duration) : this._switcher.turn_off();
        });
    }

    private async _setCapabilityValue(capability: string, value: any) {
        if (!this.hasCapability(capability)) return;
        value = value ?? null;

        const capabilityValue = this.getCapabilityValue(capability);
        capabilityValue !== value &&
            await this.setCapabilityValue(capability, value);
    }

    private _handleState = async state => {
        await this._setCapabilityValue('onoff', !!state.power);
        await this._setCapabilityValue('measure_power', state.power_consumption);

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

module.exports = SwitcherDevice;