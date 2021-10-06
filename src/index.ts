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
  trackPageViewsAndClicks: () => void,
  initialize: (environmentSecret: string, user?: IFFCUser, option?: IOption) => void,
  initUserInfo: (user: IFFCUser) => void,
  trackCustomEventAsync: (data: IFFCCustomEvent[]) => Promise<boolean>,
  trackCustomEvent: (data: IFFCCustomEvent[]) => boolean,
  trackAsync: (data: IFFCCustomEvent[]) => Promise<boolean>,
  track: (data: IFFCCustomEvent[]) => boolean,
  variationAsync: (featureFlagKey: string, defaultResult: string) => Promise<string>,
  variation: (featureFlagKey: string, defaultResult: string) => string
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

export interface IOption {
  shouldTrackPageViewsAndClicks: boolean,
  baseUrl?: string,
  appType?: string
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
  async trackPageViewsAndClicks () {    
    const self = this;
    history.pushState = ( f => function pushState(this: any){
      const argumentsTyped: any = arguments;
      var ret = f.apply(this, argumentsTyped);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.pushState);
    
    history.replaceState = ( f => function replaceState(this: any){
      const argumentsTyped: any = arguments;
      var ret = f.apply(this, argumentsTyped);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.replaceState);
    
    window.addEventListener('popstate',()=>{
      window.dispatchEvent(new Event('locationchange'))
    });
      
    window.addEventListener("locationchange", function () {
      let current_page_name = window.location.href;
      const data = [{
        route: window.location.href,
        eventName: 'pageview'
      }];

      self.trackAsync(data);
    });
  },
  initialize: function (environmentSecret: string, user?: IFFCUser, option?: IOption) {
    this.environmentSecret = environmentSecret;
    if (user) {
      this.user = user;
    }
    
    this.baseUrl = option?.baseUrl || this.baseUrl;
    this.appType = option?.appType || this.appType;
    if (option?.shouldTrackPageViewsAndClicks) {
      this.trackPageViewsAndClicks();
    }
  },
  initUserInfo (user) {
    if (!!user) {
      this.user = Object.assign({}, this.user, user);
    }
  },
  async trackCustomEventAsync (data: IFFCCustomEvent[]): Promise<boolean> {
    data = data || [];
    return await this.trackAsync(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
  },
  trackCustomEvent (data: IFFCCustomEvent[]): boolean {
    data = data || [];
    return this.track(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
  },
  async trackAsync(data: IFFCCustomEvent[]): Promise<boolean> {
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
  track: function (data: IFFCCustomEvent[]): boolean {
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
  async variationAsync(featureFlagKey: string, defaultResult: string): Promise<string> {
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
  variation: function (featureFlagKey: string, defaultResult: string): string {
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
