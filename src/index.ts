export interface IFFCUser {
  userName: string,
  email: string,
  country: string,
  key: string,
  customizeProperties?: IFFCCustomizedProperty[]
}

export interface IFFCCustomizedProperty {
  name: string,
  value: string | number | boolean
}

export interface IFFCJsClient {
  user: IFFCUser,
  environmentSecret: string,
  baseUrl: string,
  appType: string,
  initialize: (environmentSecret: string, user: IFFCUser, baseUrl?: string, appType?: string) => void,
  initUserInfo: (user: IFFCUser) => void,
  trackCustomEventAsync: (data: IFFCCustomEvent[]) => void,
  trackCustomEvent: (data: IFFCCustomEvent[]) => void,
  trackAsync: (data: IFFCCustomEvent[]) => void,
  track: (data: IFFCCustomEvent[]) => void,
  variationAsync: (featureFlagKey: string, defaultResult: string) => void,
  variation: (featureFlagKey: string, defaultResult: string) => void
}

export interface IFFCCustomEvent {
  secret?: string,
  route?: string,
  appType?: string,
  eventName: string,
  customizedProperties?: IFFCCustomizedProperty[],
  user?: IFFCUser
}

function getVariationPayloadStr(featureFlagKey: string, option: any): string {
  return JSON.stringify({
    featureFlagKeyName: featureFlagKey,
    environmentSecret: option.environmentSecret,
    ffUserName: option.user.userName,
    ffUserEmail: option.user.email,
    ffUserCountry: option.user.country,
    ffUserKeyId: option.user.key,
    ffUserCustomizedProperties: option.user.customizeProperties
  });
}

export const FFCJsClient : IFFCJsClient = {
  user: {
      userName: '',
      email: '',
      country: '',
      key: '',
      customizeProperties: []
  },
  environmentSecret: '',
  baseUrl: 'https://api.feature-flags.co',
  appType: 'Javascript',
  initialize: function (environmentSecret: string, user: IFFCUser, baseUrl?: string, appType?: string) {
    this.environmentSecret = environmentSecret;
    this.user = user;
    this.baseUrl = baseUrl || this.baseUrl;
    this.appType = appType || this.appType;
  },
  initUserInfo (user) {
    if (!!user) {
      this.user = Object.assign({}, this.user, user);
    }
  },
  async trackCustomEventAsync (data: IFFCCustomEvent[]) {
    data = data || [];
    return await this.trackAsync(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
  },
  trackCustomEvent (data: IFFCCustomEvent[]) {
    data = data || [];
    return this.track(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
  },
  async trackAsync(data: IFFCCustomEvent[]) {
    try {
      var postUrl = this.baseUrl + '/ExperimentsDataReceiver/PushData';

      const payload = data.map(d => Object.assign({}, {
        secret: this.environmentSecret,
        route: location.pathname,
        timeStamp: Date.now(),
        appType: this.appType,
        user: {
          fFUserName: this.user.userName,
          fFUserEmail: this.user.email,
          fFUserCountry: this.user.country,
          fFUserKeyId: this.user.key,
          fFUserCustomizedProperties: this.user.customizeProperties
        }
      }, d));

      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`An error has occured: ${response.status}`);
      }

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  },
  track: function (data: IFFCCustomEvent[]) {
    try {
      var postUrl = this.baseUrl + '/ExperimentsDataReceiver/PushData';

      var xhr = new XMLHttpRequest();
      xhr.open("POST", postUrl, false);

      xhr.setRequestHeader("Content-type", "application/json");

      const payload = data.map(d => Object.assign({}, {
        secret: this.environmentSecret,
        route: location.pathname,
        timeStamp: Date.now(),
        appType: this.appType,
        user: {
          fFUserName: this.user.userName,
          fFUserEmail: this.user.email,
          fFUserCountry: this.user.country,
          fFUserKeyId: this.user.key,
          fFUserCustomizedProperties: this.user.customizeProperties
        }
      }, d));

      //将用户输入值序列化成字符串
      xhr.send(JSON.stringify(payload));

      if (xhr.status !== 200) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  },
  async variationAsync(featureFlagKey: string, defaultResult: string) {
    if (defaultResult === undefined || defaultResult === null) {
      defaultResult = 'false';
    }
    
    try {
      var postUrl = this.baseUrl + '/Variation/GetMultiOptionVariation';

      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
          },
          body: getVariationPayloadStr(featureFlagKey, this)
      });

      if (!response.ok) {
        throw new Error(`An error has occured: ${response.status}`);
      }

      const result = await response.text();
      return JSON.parse(result);
    } catch(error) {
      console.log(error);
      return defaultResult;
    }
  },
  variation: function (featureFlagKey: string, defaultResult: string) {
    if (defaultResult === undefined || defaultResult === null) {
      defaultResult = 'false';
    }

    try {
      var postUrl = this.baseUrl + '/Variation/GetMultiOptionVariation';

      var xhr = new XMLHttpRequest();
      xhr.open("POST", postUrl, false);

      xhr.setRequestHeader("Content-type", "application/json");

      //将用户输入值序列化成字符串
      xhr.send(getVariationPayloadStr(featureFlagKey, this));

      if (xhr.status !== 200) {
        return defaultResult;
      }

      const result = JSON.parse(xhr.responseText);

      if (!!result['code'] && result['code'] === 'Error') {
        return defaultResult;
      }

      return result.variationValue;
    } catch (err) {
      return defaultResult;
    }
  }
};
