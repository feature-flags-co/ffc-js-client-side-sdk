export interface IFFCUser {
  userName: string,
  email: string,
  country?: string,
  key: string,
  customizeProperties?: IFFCCustomizedProperty[]
}

export interface IFFCCustomizedProperty {
  name: string,
  value: string | number | boolean
}

export interface IFFCJsClient {
  trackPageViewsAndClicks: () => void,
  initialize: (environmentSecret: string, user?: IFFCUser, option?: IOption) => void,
  initUserInfo: (user: IFFCUser) => void,
  trackCustomEventAsync: (data: IFFCCustomEvent[]) => Promise<boolean>,
  trackCustomEvent: (data: IFFCCustomEvent[]) => boolean,
  trackAsync: (data: IFFCCustomEvent[]) => Promise<boolean>,
  track: (data: IFFCCustomEvent[]) => boolean,
  variationAsync: (featureFlagKey: string, defaultResult?: string) => Promise<string>,
  variation: (featureFlagKey: string, defaultResult?: string) => string
}

export interface IFFCCustomEvent {
  secret?: string,
  route?: string,
  appType?: string,
  eventName: string,
  customizedProperties?: IFFCCustomizedProperty[],
  user?: IFFCUser
}

export interface IOption {
  shouldTrackPageViewsAndClicks: boolean,
  baseUrl?: string,
  appType?: string
}

const FF_STORAGE_KEY_PREFIX = 'ffc_ff_';

let _user: IFFCUser = {
  userName: '',
  email: '',
  country: '',
  key: '',
  customizeProperties: []
};
let _environmentSecret = '';
let _baseUrl = 'https://api.feature-flags.co';
let _appType = 'Javascript';

function getVariationPayloadStr(featureFlagKey: string): string {
  return JSON.stringify({
    featureFlagKeyName: featureFlagKey,
    environmentSecret: _environmentSecret,
    ffUserName: _user.userName,
    ffUserEmail: _user.email,
    ffUserCountry: _user.country,
    ffUserKeyId: _user.key,
    ffUserCustomizedProperties: _user.customizeProperties
  });
}

function getTrackPayloadStr(data: IFFCCustomEvent[]): string {
  return JSON.stringify(data.map(d => Object.assign({}, {
    secret: _environmentSecret,
    route: location.pathname,
    timeStamp: Date.now(),
    appType: _appType,
    user: {
      fFUserName: _user.userName,
      fFUserEmail: _user.email,
      fFUserCountry: _user.country,
      fFUserKeyId: _user.key,
      fFUserCustomizedProperties: _user.customizeProperties
    }
  }, d)));
}

// a simplified throttle function, if more options are needed, go to underscore or lodash
// call back should be a function
function throttle (callback: any, limit: number) {
  let waiting = false; 
  let result: any = null;  
                 
  return function () {                      
      if (!waiting) {
          result = callback.apply(null, arguments);  
          waiting = true;
          setTimeout(function () {  
              waiting = false;
          }, limit);
      }

      return result;
  }
}

export const FFCJsClient : IFFCJsClient = {

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
    _environmentSecret = environmentSecret;
    if (user) {
      _user = Object.assign({}, _user, user);
    }
    
    _baseUrl = option?.baseUrl || _baseUrl;
    _appType = option?.appType || _appType;
    if (option?.shouldTrackPageViewsAndClicks) {
      this.trackPageViewsAndClicks();
    }
  },
  initUserInfo (user) {
    if (!!user) {
      _user = Object.assign({}, _user, user);
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
      var postUrl = _baseUrl + '/ExperimentsDataReceiver/PushData';

      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
          },
          body: getTrackPayloadStr(data)
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
      var postUrl = _baseUrl + '/ExperimentsDataReceiver/PushData';

      var xhr = new XMLHttpRequest();
      xhr.open("POST", postUrl, false);

      xhr.setRequestHeader("Content-type", "application/json");

      //将用户输入值序列化成字符串
      xhr.send(getTrackPayloadStr(data));

      if (xhr.status !== 200) {
        return false;
      }

      return true;
    } catch (err) {
      return false;
    }
  },
  async variationAsync(featureFlagKey: string, defaultResult?: string): Promise<string> {
    const ffcKey = `${FF_STORAGE_KEY_PREFIX}${featureFlagKey}`;

    if (defaultResult === undefined || defaultResult === null) {
      defaultResult = 'false';
    }
    
    try {
      var postUrl = _baseUrl + '/Variation/GetMultiOptionVariation';

      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
          },
          body: getVariationPayloadStr(featureFlagKey)
      });

      if (!response.ok) {
        throw new Error(`An error has occured: ${response.status}`);
      }

      const result = JSON.parse(await response.text());
      if (!!result['code'] && result['code'] === 'Error') {
        return localStorage.getItem(ffcKey) === null ? defaultResult : localStorage.getItem(ffcKey) as string;
      }

      localStorage.setItem(ffcKey, result.variationValue);
      return result.variationValue;
    } catch(error) {
      console.log(error);
      return localStorage.getItem(ffcKey) === null ? defaultResult : localStorage.getItem(ffcKey) as string;
    }
  },
  variation: function (featureFlagKey: string, defaultResult?: string): string {
    const ffcKey = `${FF_STORAGE_KEY_PREFIX}${featureFlagKey}`;

    if (defaultResult === undefined || defaultResult === null) {
      defaultResult = 'false';
    }

    try {
      var postUrl = _baseUrl + '/Variation/GetMultiOptionVariation';

      var xhr = new XMLHttpRequest();
      xhr.open("POST", postUrl, false);

      xhr.setRequestHeader("Content-type", "application/json");

      //将用户输入值序列化成字符串
      xhr.send(getVariationPayloadStr(featureFlagKey));

      if (xhr.status !== 200) {
        return defaultResult;
      }

      const result = JSON.parse(xhr.responseText);

      if (!!result['code'] && result['code'] === 'Error') {
        return localStorage.getItem(ffcKey) === null ? defaultResult : localStorage.getItem(ffcKey) as string;
      }

      localStorage.setItem(ffcKey, result.variationValue);
      return result.variationValue;
    } catch (error) {
      console.log(error);
      return localStorage.getItem(ffcKey) === null ? defaultResult : localStorage.getItem(ffcKey) as string;
    }
  }
};
