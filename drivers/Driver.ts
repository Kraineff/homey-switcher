import Homey from 'homey';
import SwitcherApp from '../app';

export default class SwitcherDriver extends Homey.Driver {
    async onPairListDevices() {
        const app = this.homey.app as SwitcherApp;
        const switchers = app.switchers;
        const models = this.manifest.models;

        return Object.values<any>(switchers)
            .filter(switcher => models.includes(switcher.type))
            .map(({ name, device_id }) => ({ name, data: { id: device_id } }));
    }
}