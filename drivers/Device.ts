import Homey from 'homey';
import Switcher from 'switcher-js2';
import SwitcherApp from '../app';

export default class SwitcherDevice extends Homey.Device {
    #id!: string;
    #app!: SwitcherApp;
    #switcher?: Switcher;

    async onInit() {
        this.#id = this.getData().id;
        this.#app = this.homey.app as Switcher;

        await this.setUnavailable('Unknown device');
        this.#app.on(`state.${this.#id}`, this.#handleState);
        this.#registerCapabilities();
    }

    async onDeleted() {
        const devices = this.#app.devices;
        delete devices[this.#id];

        this.#switcher?.close();
        this.#app.off(`state.${this.#id}`, this.#handleState);
    }

    #handleState = async state => {
        if (!this.#switcher) {
            const devices = this.#app.devices;
            const device = devices[this.#id];
            this.#switcher = new Switcher(device.device_id, device.device_ip, () => {}, false,
                device.type, device.remote, device.token, device.device_key);
            await this.setAvailable();
        }

        await Promise.all([
            this.#setCapabilityValue('onoff', !!state.power),
            this.#setCapabilityValue('measure_power', state.power_consumption)
        ]);

        const minutes = state.default_shutdown_seconds / 60;
        await this.setSettings({ shutdown_time: Math.trunc(minutes / 60) + ':' + minutes % 60 })
            .catch(this.error);
    };

    async #setCapabilityValue(capability: string, value: any) {
        if (!this.hasCapability(capability)) return;
        value = value ?? null;

        if (this.getCapabilityValue(capability) === value) return;
        await this.setCapabilityValue(capability, value)
            .catch(this.error);
    }

    #registerCapabilities() {
        this.hasCapability('onoff') && this.registerCapabilityListener('onoff', (state, options) => {
            const duration = options.duration !== undefined &&
                Math.min(Math.max(options.duration / (60 * 1000), 1), 24 * 60);

            state ? this.#switcher?.turn_on(duration) : this.#switcher?.turn_off();
        });
    }

    async onSettings({ newSettings, changedKeys }) {
        if (changedKeys.includes('shutdown_time')) {
            const time = newSettings.shutdown_time.split(':');
            const hours = Math.min(Math.max(0, +time[0]), 23) * 60 * 60;
            const minutes = Math.min(Math.max(0, +time[1]), 59) * 60;
            this.#switcher.set_default_shutdown(hours + minutes);
        }
    }
}