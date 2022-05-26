import devMode from "./devmode";
import { eventHub } from "./events";
import { logger } from "./logger";
import store from "./store";
import { networkService } from "./network.service";
import { IFeatureFlagSet, ICustomEvent, IFeatureFlag, IFeatureFlagBase, IFeatureFlagVariationBuffer, IInsight, InsightType, IOption, IStreamResponse, IUser, StreamResponseEventType } from "./types";
import { ffcguid, validateOption, validateUser } from "./utils";
import { Queue } from "./queue";
import { featureFlagEvaluatedBufferTopic, featureFlagEvaluatedTopic, insightsFlushTopic, insightsTopic, websocketReconnectTopic } from "./constants";
import autoCapture from "./autocapture";


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

export class Ffc {
  private _readyEventEmitted: boolean = false;
  private _readyPromise: Promise<IFeatureFlagBase[]>;

  private _insightsQueue: Queue<IInsight> = new Queue<IInsight>(1, insightsFlushTopic);
  private _featureFlagEvaluationBuffer: Queue<IFeatureFlagVariationBuffer> = new Queue<IFeatureFlagVariationBuffer>();
  private _option: IOption = {
    secret: '',
    api: 'https://api.featureflag.co',
    devModePassword: '',
    enableDataSync: true,
    appType: 'javascript'
  };

  constructor() {
    this._readyPromise = new Promise<IFeatureFlagBase[]>((resolve, reject) => {
      this.on('ready', () => {
        const featureFlags = store.getFeatureFlags();
        resolve(mapFeatureFlagsToFeatureFlagBaseList(featureFlags));
        if (this._option.enableDataSync){
          const buffered = this._featureFlagEvaluationBuffer.flush().map(f => {
            const featureFlag = featureFlags[f.id];
            if (!featureFlag) {
              logger.log(`Called unexisting feature flag: ${f.id}`);
              return null;
            }
            
            const variation = featureFlag.variationOptions.find(o => o.value === f.variationValue);
            if (!variation) {
              logger.log(`Sent buffered insight for feature flag: ${f.id} with unexisting default variation: ${f.variationValue}`);
            } else {
              logger.logDebug(`Sent buffered insight for feature flag: ${f.id} with variation: ${variation.value}`);
            }

            return {
              insightType: InsightType.featureFlagUsage,
              id: featureFlag.id,
              timestamp: f.timestamp,
              sendToExperiment: featureFlag.sendToExperiment,
              variation: variation || { id: -1, value: f.variationValue}
            }
          });

          networkService.sendInsights(buffered.filter(x => !!x));
        }
      });
    });

    // reconnect to websocket
    eventHub.subscribe(websocketReconnectTopic, async () => {
      try {
        await this.dataSync();
        if (!this._readyEventEmitted) {
          this._readyEventEmitted = true;
          eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(store.getFeatureFlags()));
        }
      }catch(err) {
        logger.log('data sync error', err);
      }
    });

    eventHub.subscribe(featureFlagEvaluatedBufferTopic, (data: IFeatureFlagVariationBuffer) => {
      this._featureFlagEvaluationBuffer.add(data);
    });

    // track feature flag usage data
    eventHub.subscribe(insightsFlushTopic, () => {
      if (this._option.enableDataSync){
        networkService.sendInsights(this._insightsQueue.flush());
      }
    });

    eventHub.subscribe(featureFlagEvaluatedTopic, (data: IInsight) => {
      this._insightsQueue.add(data);
    });

    eventHub.subscribe(insightsTopic, (data: IInsight) => {
      this._insightsQueue.add(data);
    });
  }

  on(name: string, cb: Function) {
    eventHub.subscribe(name, cb);
  }

  waitUntilReady(): Promise<IFeatureFlagBase[]> {
    return this._readyPromise;
  }

  async init(option: IOption) {
    const validateOptionResult = validateOption(option);
    if (validateOptionResult !== null) {
      logger.log(validateOptionResult);
      return;
    }

    this._option = Object.assign({}, this._option, option, { api: (option.api || this._option.api)?.replace(/\/$/, '') });

    if (this._option.enableDataSync) {
      networkService.init(this._option.api!, this._option.secret, this._option.appType!);
    }
    
    await this.identify(option.user || createorGetAnonymousUser());
    if (this._option.enableDataSync) {
      autoCapture.init();
    }
  }

  async identify(user: IUser): Promise<void> {
    const validateUserResult = validateUser(user);
    if (validateUserResult !== null) {
      logger.log(validateUserResult);
      return;
    }

    user.customizedProperties = user.customizedProperties?.map(p => ({name: p.name, value: `${p.value}`}));
    this._option.user = Object.assign({}, user);

    store.userId = this._option.user.id;

    networkService.identify(this._option.user);
    await this.bootstrap();
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

  async logout(): Promise<IUser> {
    const anonymousUser = createorGetAnonymousUser();
    await this.identify(anonymousUser);
    return anonymousUser;
  }

  async bootstrap(featureFlags?: IFeatureFlag[]): Promise<void> {
    featureFlags = featureFlags || this._option.bootstrap;
    if (featureFlags && featureFlags.length > 0) {
      const data = {
        featureFlags: featureFlags.reduce((res, curr) => {
          const { id, variation, timestamp, variationOptions, sendToExperiment } = curr;
          res[id] = { id, variation, timestamp, variationOptions, sendToExperiment };

          return res;
        }, {} as { [key: string]: IFeatureFlag })
      };

      store.setFullData(data);
      logger.logDebug('bootstrapped with full data');
    }

    if (this._option.enableDataSync) {
      // start data sync
      try {
        await this.dataSync();
      }catch(err) {
        logger.log('data sync error', err);
      }
      
      store.isDevMode = !!store.isDevMode;
    }

    if (!this._readyEventEmitted) {
      this._readyEventEmitted = true;
      eventHub.emit('ready', mapFeatureFlagsToFeatureFlagBaseList(store.getFeatureFlags()));
    }
    
    devMode.init(this._option.devModePassword || '');
  }

  private async dataSync(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      const timestamp = Math.max(...Object.values(store.getFeatureFlags()).map(ff => ff.timestamp), 0);

      networkService.createConnection(timestamp, (message: IStreamResponse) => {
        if (message && message.userKeyId === this._option.user?.id) {
          const { featureFlags } = message;

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
    return variationWithInsightBuffer(key, defaultResult) || defaultResult;
  }

  boolVariation(key: string, defaultResult: boolean): boolean {
    const variation = variationWithInsightBuffer(key, defaultResult);
    return !!variation ? variation.toLocaleLowerCase() === 'true' : defaultResult;
  }

  getUser(): IUser {
    return { ...this._option.user! };
  }

  sendCustomEvent(data: ICustomEvent[]): void {
    (data || []).forEach(d => this._insightsQueue.add({
      insightType: InsightType.customEvent,
      type: 'CustomEvent',
      ...d
    }))
  }

  sendFeatureFlagInsight(key: string, variation: string) {
    this.variation(key, variation);
  }

  getAllFeatureFlags(): IFeatureFlagSet {
    const flags = store.getFeatureFlags();

    return Object.values(flags).reduce((acc, curr) => {
      acc[curr.id] = curr.variation;
      return acc;
    }, {});
  }
}

const variationWithInsightBuffer = (key: string, defaultResult: string | boolean) => {
  const variation = store.getVariation(key);
  if (variation === undefined) {
    eventHub.emit(featureFlagEvaluatedBufferTopic, {
      id: key,
      timestamp: Date.now(),
      variationValue: `${defaultResult}`
    } as IFeatureFlagVariationBuffer);
  }

  return variation;
}

const ffcClient = new Ffc();
window['activateFfcDevMode'] = (password?: string) => ffcClient.activateDevMode(password);
window['quitFfcDevMode'] = () => ffcClient.quitDevMode();

export default ffcClient;

