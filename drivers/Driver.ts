import Homey from 'homey';
import SwitcherApp from '../app';

export default class SwitcherDriver extends Homey.Driver {
    async onPairListDevices() {
        const app = this.homey.app as SwitcherApp;
        const devices = app.devices;
        const models = this.manifest.models;

        return Object.values<any>(devices)
            .filter(device => models.includes(device.type))
            .map(({ name, device_id }) => ({ name, data: { id: device_id } }));
    }
}