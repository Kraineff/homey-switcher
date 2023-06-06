import Homey from 'homey';

module.exports = class SwitcherMiniDriver extends Homey.Driver {
    async onPairListDevices() {
        const devices = this.homey.settings.get('devices');

        return Object.values(devices)
            .filter((device: any) => device.type === 'mini')
            .map((device: any) => ({ name: device.name, data: { id: device.device_id } }));
    }
}