import { logger } from "../logger";
import { get, post, track } from "../network.service";
import { ICustomEvent, IUser } from "../types";
import { IExptMetricSetting, IZeroCode } from "./types";

export class AutoCaptureNetworkService {
    constructor(private api: string, private secret: string, private appType: string, public user: IUser) { }

    async track(data: ICustomEvent[]): Promise<void> {
        return track(this.api, this.secret, this.appType, this.user, data);
    }

    async getActiveExperimentMetricSettings(): Promise<IExptMetricSetting[] | []> {
        const exptMetricSettingLocalStorageKey = 'ffc_expt_metric';
        try {
            const result = await get(`${this.api}/api/experiments/${this.secret}`, { envSecret: this.secret });

            localStorage.setItem(exptMetricSettingLocalStorageKey, JSON.stringify(result));
            return result;
        } catch (error) {
            console.log(error);
            return !!localStorage.getItem(exptMetricSettingLocalStorageKey) ? JSON.parse(localStorage.getItem(exptMetricSettingLocalStorageKey) as string) : [];
        }
    }

    async getZeroCodeSettings(): Promise<IZeroCode[] | []> {
        const zeroCodeSettingLocalStorageKey = 'ffc_zcs';
        try {
            const result = await get(`${this.api}/api/zero-code/${this.secret}`, { envSecret: this.secret });

            localStorage.setItem(zeroCodeSettingLocalStorageKey, JSON.stringify(result));
            return result;
        } catch (error) {
            console.log(error);
            return !!localStorage.getItem(zeroCodeSettingLocalStorageKey) ? JSON.parse(localStorage.getItem(zeroCodeSettingLocalStorageKey) as string) : [];
        }
    }
}