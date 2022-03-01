import { websocketReconnectTopic } from "./constants";
import { eventHub } from "./events";
import { logger } from "./logger";
import { ICustomEvent, IExptMetricSetting, IFeatureFlagVariation, IInsight, InsightType, IStreamResponse, IUser, IZeroCode } from "./types";
import { ffcguid, generateConnectionToken, throttleAsync } from "./utils";

const socketConnectionIntervals = [250, 500, 1000, 2000, 4000, 8000, 10000, 30000];
let retryCounter = 0;

class NetworkService {
  private user: IUser | undefined;
  private api: string | undefined;
  private secret: string | undefined;
  private appType: string | undefined;

  constructor(){}

  init(api: string, secret: string, appType: string) {
    this.api = api;
    this.secret = secret;
    this.appType = appType;
  }

  identify(user: IUser) {
    if (this.user?.id !== user.id) {
      this.socket?.close();
    }

    this.user = { ...user };
  }

  private socket: WebSocket | undefined;

  createConnection(timestamp: number, onMessage: (response: IStreamResponse) => any) {
    const that = this;
    if (that.socket) {
      return;
    }

    const startTime = Date.now();
    // Create WebSocket connection.
    const url = this.api?.replace(/^http/, 'ws') + `/streaming?type=client&token=${generateConnectionToken(this.secret!)}`;
    that.socket = new WebSocket(url);

    function sendPingMessage() {
      const payload = {
        messageType: 'ping',
        data: null
      };
  
      setTimeout(() => {
        try {
          if (that.socket?.readyState === that.socket!.OPEN) {
            that.socket!.send(JSON.stringify(payload));
            sendPingMessage();
          } else {
            logger.logDebug(`socket closed at ${new Date()}`);
          }
        } catch (err) {
          logger.logDebug(err);
        }
      }, 18000);
    }
  
    // Connection opened
    that.socket.addEventListener('open', function (event) {
      retryCounter = 0;
  
      logger.logDebug(`Connection time: ${Date.now() - startTime} ms`);
      const { userName, email, country, id, customizedProperties } =that.user!;
      const payload = {
        messageType: 'data-sync',
        data: {
          user: {
            userName,
            email,
            country,
            userKeyId: id,
            customizedProperties,
          },
          timestamp
        }
      };
  
      that.socket?.send(JSON.stringify(payload));
  
      sendPingMessage();
    });
  
    // Connection closed
    that.socket.addEventListener('close', function (event) {
      that.socket = undefined;
      logger.logDebug('close');
      if (event.code === 4003) { // do not reconnect when 4003
        return;
      }
      const waitTime = socketConnectionIntervals[Math.min(retryCounter++, socketConnectionIntervals.length)];
      setTimeout(() => eventHub.emit(websocketReconnectTopic, {}), waitTime);
      logger.logDebug(waitTime);
    });
  
    // Connection error
    that.socket!.addEventListener('error', function (event) {
      // reconnect
      logger.logDebug('error');
      that.socket!.close();
    });
  
    // Listen for messages
    that.socket.addEventListener('message', function (event) {
      const message = JSON.parse(event.data);
      if (message.messageType === 'data-sync') {
        onMessage(message.data);
        if (message.data.featureFlags.length > 0) {
          logger.logDebug('socket push update time(ms): ', Date.now() - message.data.featureFlags[0].timestamp);
        }
      }
    });
  }

  private __getUserInfo(): any {
    const { userName, email, country, id, customizedProperties } = this.user!;
    return {
      userName,
      email,
      country,
      keyId: id,
      customizedProperties: customizedProperties,
    }
  }

  sendInsights = throttleAsync(ffcguid(), async (data: IInsight[]): Promise<void> => {
    if (!this.secret || !this.user || !data || data.length === 0) {
      return;
    }
  
    try {
      const payload = [{
        user: this.__getUserInfo(),
        userVariations: data.filter(d => d.insightType === InsightType.featureFlagUsage).map(v => ({
          featureFlagKeyName: v.id,
          sendToExperiment: v.sendToExperiment,
          timestamp: v.timestamp,
          variation: {
            localId: v.variation!.id,
            variationValue: v.variation!.value
          }
        })),
        metrics: data.filter(d => d.insightType !== InsightType.featureFlagUsage).map(d => ({
          route: location.pathname,
          numericValue: d.numericValue === null || d.numericValue === undefined? 1 : d.numericValue,
          appType: this.appType,
          eventName: d.eventName,
          type: d.type
        }))
      }];
  
      await post(`${this.api}/api/public/track`, payload, { envSecret: this.secret });
    } catch (err) {
      logger.logDebug(err);
    }
  })

  async getActiveExperimentMetricSettings(): Promise<IExptMetricSetting[] | []> {
    const exptMetricSettingLocalStorageKey = 'ffc_expt_metric';
    try {
        const result = await get(`${this.api}/api/public/sdk/experiments`, { envSecret: this.secret! });

        localStorage.setItem(exptMetricSettingLocalStorageKey, JSON.stringify(result.data));
        return result;
    } catch (error) {
        console.log(error);
        return !!localStorage.getItem(exptMetricSettingLocalStorageKey) ? JSON.parse(localStorage.getItem(exptMetricSettingLocalStorageKey) as string) : [];
    }
}

async getZeroCodeSettings(): Promise<IZeroCode[] | []> {
    const zeroCodeSettingLocalStorageKey = 'ffc_zcs';
    try {
        const result = await get(`${this.api}/api/public/sdk/zero-code`, { envSecret: this.secret! });

        localStorage.setItem(zeroCodeSettingLocalStorageKey, JSON.stringify(result.data));
        return result;
    } catch (error) {
        console.log(error);
        return !!localStorage.getItem(zeroCodeSettingLocalStorageKey) ? JSON.parse(localStorage.getItem(zeroCodeSettingLocalStorageKey) as string) : [];
    }
}
}

export const networkService = new NetworkService();

export async function post(url: string = '', data: any = {}, headers: { [key: string]: string } = {}) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, headers),
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });

    return response.status === 200 ? response.json() : {};
  } catch (err) {
    logger.logDebug(err);
    return {};
  }
}

export async function get(url: string = '', headers: { [key: string]: string } = {}) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: Object.assign({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }, headers)
    });

    return response.status === 200 ? response.json() : {};
  } catch (err) {
    logger.logDebug(err);
    return null;
  }
}
