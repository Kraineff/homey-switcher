import Homey from 'homey';

export default class SwitcherDriver extends Homey.Driver {
    async onPairListDevices() {
        const devices = this.homey.settings.get('devices');
        const models = this.manifest.models;

        return Object.values<any>(devices)
            .filter(device => models.includes(device.type))
            .map(({ name, device_id }) => ({ name, data: { id: device_id } }));
    }
}

module.exports = SwitcherDriver;