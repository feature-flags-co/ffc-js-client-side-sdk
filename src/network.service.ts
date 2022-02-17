import { websocketReconnectTopic } from "./constants";
import { eventHub } from "./events";
import { logger } from "./logger";
import { ICustomEvent, IFeatureFlagVariation, IStreamResponse, IUser } from "./types";

const socketConnectionIntervals = [250, 500, 1000, 2000, 4000, 8000, 10000, 30000];
let retryCounter = 0;

export function connectWebSocket(url: string, user: IUser, timestamp: number, onMessage: (response: IStreamResponse) => any) {
  // Create WebSocket connection.
  const startTime = Date.now();
  const socket = new WebSocket(url);

  // Connection opened
  socket.addEventListener('open', function (event) {
    retryCounter = 0;

    logger.logDebug(`Connection time: ${Date.now() - startTime} ms`);
    const { userName, email, country, id, customizeProperties } = user;
    const payload = {
      messageType: 'data-sync',
      data: {
        user: {
          userName,
          email,
          country,
          userKeyId: id,
          customizeProperties,
        },
        timestamp
      }
    };

    socket.send(JSON.stringify(payload));
  });

  // Connection closed
  socket.addEventListener('close', function (event) {
    logger.logDebug('close');
    if (event.code === 4003) { // do not reconnect when 4003
      return;
    }
    const waitTime = socketConnectionIntervals[Math.min(retryCounter++, socketConnectionIntervals.length)];
    setTimeout(() => eventHub.emit(websocketReconnectTopic, {}), waitTime);
    logger.logDebug(waitTime);
  });

  // Connection error
  socket.addEventListener('error', function (event) {
    // reconnect
    logger.logDebug('error');
    socket.close();
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    const message = JSON.parse(event.data);
    if (message.messageType === 'data-sync') {
      onMessage(message.data);
      if (message.data.featureFlags.length > 0) {
        logger.logDebug('socket push update time(ms): ', Date.now() - message.data.featureFlags[0].timestamp);
      }
    }
  });
}

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

export async function sendFeatureFlagInsights(api: string, secret: string, user: IUser, variations: IFeatureFlagVariation[]) {
  if (!secret || !user || !variations || variations.length === 0) {
    return;
  }

  try {
    const { userName, email, country, id, customizeProperties } = user;
    const payload = [{
      userName,
      email,
      country,
      UserKeyId: id,
      UserCustomizedProperties: customizeProperties,
      userVariations: variations.map(v => ({
        featureFlagKeyName: v.id,
        sendToExperiment: v.sendToExperiment,
        timestamp: v.timestamp,
        variation: {
          localId: v.variation.id,
          variationValue: v.variation.value
        }
      }))
    }];

    await post(`${api}/api/public/analytics/track/feature-flags`, payload, { envSecret: secret });
  } catch (err) {
    logger.logDebug(err);
  }
}

export async function track(api: string, secret: string, appType: string, user: IUser, data: ICustomEvent[]): Promise<void> {
  try {
      const payload = data.map(d => Object.assign({}, {
          secret: secret,
          route: location.pathname,
          numericValue: 1,
          appType: appType,
          user: {
              fFUserName: user.userName,
              fFUserEmail: user.email,
              fFUserCountry: user.country,
              fFUserKeyId: user.id,
              fFUserCustomizedProperties: user.customizeProperties
          }
      }, d));

      await post(`${api}/ExperimentsDataReceiver/PushData`, payload, { envSecret: secret });
  } catch (err) {
      logger.logDebug(err);
  }
}
