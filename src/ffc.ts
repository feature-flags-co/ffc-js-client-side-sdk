import devMode from "./devmode";
import { eventHub } from "./events";
import { logger } from "./logger";
import store from "./store";
import { sendFeatureFlagInsights, socketService, track } from "./network.service";
import { ICustomEvent, IFeatureFlag, IFeatureFlagBase, IFeatureFlagVariation, IOption, IStreamResponse, IUser, StreamResponseEventType } from "./types";
import { ffcguid, generateConnectionToken, validateOption, validateUser } from "./utils";
import { Queue } from "./queue";
import { featureFlagEvaluatedTopic, featureFlagInsightFlushTopic, websocketReconnectTopic } from "./constants";
import autoCapture from "./autocapture/autocapture";


function createorGetAnonymousUser(): IUser {
  let sessionId = ffcguid();
  var c_name = 'JSESSIONID';
  if (document.cookie.length > 0) {
    let c_start = document.cookie.indexOf(c_name + "=")
    if (c_start != -1) {
      c_start = c_start + c_name.length + 1
      let c_end = document.cookie.indexOf(";", c_start)
      if (c_end == -1) c_end = document.cookie.length
      sessionId = unescape(document.cookie.substring(c_start, c_end));
    }
  }

  return {
    userName: sessionId,
    email: `${sessionId}@anonymous.com`,
    id: sessionId
  };
}

function mapFeatureFlagsToFeatureFlagBaseList(featureFlags: { [key: string]: IFeatureFlag }): IFeatureFlagBase[] {
  return Object.keys(featureFlags).map((cur) => {
    const { id, variation } = featureFlags[cur];
    return { id, variation};
  });
}

class Ffc {
  private _readyEventEmitted: boolean = false;
  private _readyPromise: Promise<IFeatureFlagBase[]>;

  private _featureFlagInsightQueue: Queue<IFeatureFlagVariation> = new Queue<IFeatureFlagVariation>(1, featureFlagInsightFlushTopic);
  private _option: IOption = {
    secret: '',
    api: 'https://api.feature-flags.co',
    devModePassword: '',
    enableDataSync: true,
    appType: 'javascript',
    //streamEndpoint: IS_PROD ? '' : 'wss://localhost:5000/streaming',
  };

  constructor() {
    this._readyPromise = new Promise<IFeatureFlagBase[]>((resolve, reject) => {
      this.on('ready', () => {
        resolve(mapFeatureFlagsToFeatureFlagBaseList(store.getFeatureFlags()));
      });
    });

    // reconnect to websocket
    eventHub.subscribe(websocketReconnectTopic, () => {
      this.dataSync().then(() => {
        if (!this._readyEventEmitted) {
          this._readyEventEmitted = true;
          eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(store.getFeatureFlags()));
        }
      });
    });

    // track feature flag usage data
    eventHub.subscribe(featureFlagInsightFlushTopic, () => {
      if (this._option.enableDataSync){
        sendFeatureFlagInsights(this._option.api!, this._option.secret, this._option.user!, this._featureFlagInsightQueue.removeAll());
      }
    });

    eventHub.subscribe(featureFlagEvaluatedTopic, (data: IFeatureFlagVariation) => {
      this._featureFlagInsightQueue.add(data);
    });
  }

  on(name: string, cb: Function) {
    eventHub.subscribe(name, cb);
  }

  waitUntilReady(): Promise<IFeatureFlagBase[]> {
    return this._readyPromise;
  }

  init(option: IOption) {
    const validateOptionResult = validateOption(option);
    if (validateOptionResult !== null) {
      console.log(validateOptionResult);
      return;
    }

    this._option = Object.assign({}, this._option, option, { api: (option.api || this._option.api)?.replace(/\/$/, '') });

    socketService.init(this._option.api!, this._option.secret);
    autoCapture.init(this._option.api!, this._option.secret, this._option.appType!, this._option.user!);
    this.identify(option.user || createorGetAnonymousUser());
  }

  identify(user: IUser): void {
    const validateUserResult = validateUser(user);
    if (validateUserResult !== null) {
      console.log(validateUserResult);
      return;
    }

    this._option.user = Object.assign({}, user);

    store.userId = this._option.user.id;
    //setTimeout(() => this.bootstrap(), 20000);

    socketService.identify(this._option.user);
    autoCapture.identify(this._option.user);
    this.bootstrap();
  }

  activateDevMode(password?: string){
    devMode.activateDevMode(password);
  }

  openDevModeEditor() {
    devMode.openEditor();
  }

  quitDevMode() {
    devMode.quit();
  }

  logout(): void {
    const anonymousUser = createorGetAnonymousUser();
    this.identify(anonymousUser);
  }

  bootstrap(featureFlags?: IFeatureFlag[]): void {
    featureFlags = featureFlags || this._option.boostrap;
    if (featureFlags && featureFlags.length > 0) {
      const data = {
        featureFlags: featureFlags.reduce((res, curr) => {
          const { id, variation, timestamp, variationOptions, sendToExperiment } = curr;
          res[id] = { id, variation, timestamp, variationOptions, sendToExperiment };

          return res;
        }, {} as { [key: string]: IFeatureFlag })
      };

      store.setFullData(data);
      eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(store.getFeatureFlags()));
      logger.logDebug('bootstrapped with full data');
    }

    if (this._option.enableDataSync) {
      // start data sync
      this.dataSync().then(() => {
        store.isDevMode = !!store.isDevMode;
        if (!this._readyEventEmitted) {
          this._readyEventEmitted = true;
          eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(store.getFeatureFlags()));
        }
      });
    }
    
    devMode.init(this._option.devModePassword || '');
  }

  private async dataSync(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      //const serverUrl: any = this._option.api?.replace(/^http/, 'ws') + `/streaming?type=client&token=${generateConnectionToken(this._option.secret)}`;
      const timestamp = Math.max(...Object.values(store.getFeatureFlags()).map(ff => ff.timestamp), 0);

      socketService.createConnection(timestamp, (message: IStreamResponse) => {
        const { featureFlags } = message;

        if (message && message.userKeyId === this._option.user?.id) {
          switch (message.eventType) {
            case StreamResponseEventType.full: // full data
            case StreamResponseEventType.patch: // partial data
              const data = {
                featureFlags: featureFlags.reduce((res, curr) => {
                  const { id, variation, timestamp, variationOptions, sendToExperiment } = curr;
                  res[id] = { id, variation, timestamp, variationOptions, sendToExperiment };

                  return res;
                }, {} as { [key: string]: IFeatureFlag })
              };

              if (message.eventType === StreamResponseEventType.full) {
                store.setFullData(data);
                logger.logDebug('synchonized with full data');
              } else {
                store.updateBulkFromRemote(data);
                logger.logDebug('synchonized with partial data');
              }

              break;
            default:
              logger.logDebug('invalid stream event type: ' + message.eventType);
              break;
          }
        }

        resolve();
      });
    });
  }

  variation(key: string, defaultResult: string): string {
    return store.getVariation(key) || defaultResult;
  }

  boolVariation(key: string, defaultResult: boolean): boolean {
    const variation = store.getVariation(key);
    return !!variation ? variation.toLocaleLowerCase() === 'true' : defaultResult;
  }

  async sendCustomEvent(data: ICustomEvent[]) {
    data = data || [];
    return await track(this._option.api!, this._option.secret, this._option.appType!, this._option.user!, data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
  }
}

const ffc = new Ffc();
window['activateFfcDevMode'] = (password?: string) => ffc.activateDevMode(password);

export default ffc;

