import { DevMode } from "./devmode";
import { IS_PROD } from "./environment";
import { eventHub } from "./events";
import { logger } from "./logger";
import { Store } from "./store";
import { connectWebSocket, sendFeatureFlagInsights } from "./network.service";
import { IFeatureFlag, IFeatureFlagBase, IFeatureFlagVariation, IOption, IStreamResponse, IUser, StreamResponseEventType } from "./types";
import { ffcguid, generateConnectionToken, validateOption } from "./utils";
import { Queue } from "./queue";
import { featureFlagEvaluatedTopic, featureFlagInsightFlushTopic, websocketReconnectTopic } from "./constants";


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

  private _devMode: DevMode;
  private _store: Store = new Store();
  private _featureFlagInsightQueue: Queue<IFeatureFlagVariation> = new Queue<IFeatureFlagVariation>(1, featureFlagInsightFlushTopic);
  private _option: IOption = {
    secret: '',
    api: IS_PROD ? 'https://api.feature-flags.co' : 'https://ffc-api-ce2-dev.chinacloudsites.cn',
    devModePassword: '',
    enableDataSync: true,
    //streamEndpoint: IS_PROD ? '' : 'wss://localhost:5000/streaming',
  };

  constructor() {
    this._devMode = new DevMode(this._store);
    this._readyPromise = new Promise<IFeatureFlagBase[]>((resolve, reject) => {
      this.on('ready', () => {
        resolve(mapFeatureFlagsToFeatureFlagBaseList(this._store.getFeatureFlags()));
      });
    });

    // reconnect to websocket
    eventHub.subscribe(websocketReconnectTopic, () => {
      this.dataSync().then(() => {
        if (!this._readyEventEmitted) {
          this._readyEventEmitted = true;
          eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(this._store.getFeatureFlags()));
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

    this.identify(option.user || createorGetAnonymousUser());
  }

  identify(user: IUser): void {
    this._option.user = Object.assign({}, this._option.user, user);

    this._store.userId = this._option.user.id;
    //setTimeout(() => this.bootstrap(), 20000);
    this.bootstrap();
  }

  activateDevMode(password?: string){
    this._devMode.activateDevMode(password);
  }

  openDevModeEditor() {
    this._devMode.openEditor();
  }

  quitDevMode() {
    this._devMode.quit();
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
          const { id, variation, timestamp, variationOptions, isArchived, sendToExperiment } = curr;
          res[id] = { id, variation, timestamp, variationOptions, isArchived, sendToExperiment };

          return res;
        }, {} as { [key: string]: IFeatureFlag })
      };

      this._store.setFullData(data);
      eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(this._store.getFeatureFlags()));
      logger.logDebug('bootstrapped with full data');
    }

    if (this._option.enableDataSync) {
      // start data sync
      this.dataSync().then(() => {
        this._store.isDevMode = !!this._store.isDevMode;
        if (!this._readyEventEmitted) {
          this._readyEventEmitted = true;
          eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(this._store.getFeatureFlags()));
        }
      });
    }
    
    this._devMode.init(this._option.devModePassword || '');
  }

  async dataSync(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      const serverUrl: any = this._option.api?.replace(/^http/, 'ws') + `/streaming?type=client&token=${generateConnectionToken(this._option.secret)}`;
      const timestamp = Math.max(...Object.values(this._store.getFeatureFlags()).map(ff => ff.timestamp), 0);

      connectWebSocket(serverUrl, this._option.user!, timestamp, (message: IStreamResponse) => {
        const { featureFlags } = message;

        if (message) {
          switch (message.eventType) {
            case StreamResponseEventType.full: // full data
            case StreamResponseEventType.patch: // partial data
              const data = {
                featureFlags: featureFlags.reduce((res, curr) => {
                  const { id, variation, timestamp, variationOptions, isArchived, sendToExperiment } = curr;
                  res[id] = { id, variation, timestamp, variationOptions, isArchived, sendToExperiment };

                  return res;
                }, {} as { [key: string]: IFeatureFlag })
              };

              if (message.eventType === StreamResponseEventType.full) {
                this._store.setFullData(data);
                logger.logDebug('synchonized with full data');
              } else {
                this._store.updateBulkFromRemote(data);
                logger.logDebug('synchonized with partial data');
              }

              break;
            default:
              logger.logDebug('invalid stream event type: ' + message.eventType);
              break;
          }

          resolve();
        }
      });
    });
  }

  variation(key: string, defaultResult: string): string {
    return this._store.getVariation(key) || defaultResult;
  }

  boolVariation(key: string, defaultResult: boolean): boolean {
    const variation = this._store.getVariation(key);
    return !!variation ? variation.toLocaleLowerCase() === 'true' : defaultResult;
  }
}

const ffc = new Ffc();
window['activateFfcDevMode'] = (password?: string) => ffc.activateDevMode(password);

export default ffc;

