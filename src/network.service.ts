import { websocketReconnectTopic } from "./constants";
import { eventHub } from "./events";
import { logger } from "./logger";
import { Store } from "./store";
import { IFeatureFlagVariation, IStreamResponse, IUser } from "./types";

const socketConnectionIntervals = [250,500,1000,2000,4000,8000,10000,30000];
let retryCounter = 0;

export function connectWebSocket(url: string, user: IUser, timestamp: number, onMessage: (response: IStreamResponse) => any){
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
      if (message.data.featureFlags.length > 0){
        logger.logDebug('socket push update time(ms): ', Date.now() - message.data.featureFlags[0].timestamp);
      }
    }
  });
}

async function postData(url: string = '', data: any = {}, headers: {[key: string]: string} = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST',
    headers: Object.assign({
      'Content-Type': 'application/json'
    }, headers),
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });

  try {
    return response.status === 200? response.json() : {};
  } catch (err) {
    logger.logDebug(response);
    return {};
  }
  
}

export async function sendFeatureFlagInsights(apiBaseUrl: string, envSecret: string, user: IUser, variations: IFeatureFlagVariation[]) {
  if (!envSecret || !user || !variations || variations.length === 0) {
    return;
  }

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

  await postData(`${apiBaseUrl}/api/public/analytics/track/feature-flags`, payload, {envSecret: envSecret});
  logger.logDebug('sendFeatureFlagInsights');
  logger.logDebug(payload);
}
