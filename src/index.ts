import { IFFCUser, IFFCCustomEvent, IFFCJsClient, IOption, IZeroCode, IExptMetricSetting, EventType, UrlMatchType, ICssSelectorItem } from "./types";

declare global {
  interface Window {
    WebKitMutationObserver:any;
    MozMutationObserver: any;
  }
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
let _throttleWait: number = 5 * 60000; // millionseconds

// a simplified throttle function, if more options are needed, go to underscore or lodash
// call back should be a function
// current function throttle with the wait time and the current url, the same function will be called only once within the time window
const API_CALL_RESULTS : {[key: string]: string} = {};
const FOOT_PRINTS: string[] = [];
function throttle (callback: any): any {
  let waiting = false; 

  let getFootprint = (args: any): string => JSON.stringify(args);

  return function () {
    const footprint = getFootprint(arguments);
    const idx = FOOT_PRINTS.findIndex(f => f === footprint);
    if (!waiting || idx === -1) {
      waiting = true;
      if (idx === -1) {
        FOOT_PRINTS.push(footprint);
      }

      API_CALL_RESULTS[footprint] = callback.apply(null, arguments);
      
      setTimeout(function () {
          waiting = false;
      }, _throttleWait);
    }

    return API_CALL_RESULTS[footprint];
  }
}

function throttleAsync (callback: any): any {
  let waiting = false; 

  let getFootprint = (args: any): string => JSON.stringify(args);

  return async function (...args) {
    const footprint = getFootprint(args);
    const idx = FOOT_PRINTS.findIndex(f => f === footprint);
    if (!waiting || idx === -1) {
      waiting = true;
      if (idx === -1) {
        FOOT_PRINTS.push(footprint);
      }
      
      API_CALL_RESULTS[footprint] = await callback.apply(null, args);
      
      setTimeout(function () {
          waiting = false;
      }, _throttleWait);
    }

    return API_CALL_RESULTS[footprint];
  }
}

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
    numericValue: 1,
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

// test if the current page url mathch the given url
function isUrlMatch(matchType: UrlMatchType, url: string): boolean {
  const current_page_url = window.location.href;
  if (url === null || url === undefined || url === '') {
    return true;
  }
  
  switch(matchType){
    case UrlMatchType.Substring:
      return current_page_url.includes(url);
    default:
      return false;
  }
}

/********************************Zero code setting *************************************/
async function getZeroCodeSettings(envSecret: string): Promise<IZeroCode[] | []> {
  const zeroCodeSettingLocalStorageKey = 'ffc_zcs';
  try {
    const response = await fetch(`${_baseUrl}/api/zero-code/${envSecret}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        }
    });

    // if (!response.ok) {
    //   throw new Error(`An error has occured: ${response.status}`);
    // }

    const result = await response.text();

    // if (!!result['code'] && result['code'] === 'Error') {
    //   return localStorage.getItem(ffcKey) === null ? defaultResult : localStorage.getItem(ffcKey) as string;
    // }

    localStorage.setItem(zeroCodeSettingLocalStorageKey, result);
    return JSON.parse(result);
  } catch(error) {
    console.log(error);
    return !!localStorage.getItem(zeroCodeSettingLocalStorageKey) ? JSON.parse(localStorage.getItem(zeroCodeSettingLocalStorageKey) as string) : [];
  }
}

const ffc_special_value = '___071218__';

function groupBy (xs: any, key: string): {[key: string] : any} {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

function revertRules (items: ICssSelectorItem[]) {
  const cssSelectors = items.map(it => it.cssSelector).join(',');
  let nodes = document.querySelectorAll(cssSelectors) as NodeListOf<HTMLElement>;
  nodes.forEach(node => {
    const style = {};
    if (node.style.display === 'none') {
      style['display'] = 'block';
    }

    const rawStyle = node.getAttribute(`data-ffc-${ffc_special_value}`);
    if (rawStyle !== null && rawStyle !== '') {
      Object.assign(style, JSON.parse(rawStyle)); 
    }

    Object.assign(node.style, style);
  });
}

function applyRules(items: ICssSelectorItem[], ffResult: string) {
  const groupedItems: { [key: string]: ICssSelectorItem[] } = groupBy(items, 'variationValue');
  
  // hide items
  for (let [variationValue, itms] of Object.entries(groupedItems)) {
    if (variationValue !== ffResult) {
      const cssSelectors = (itms as ICssSelectorItem[]).map(it => it.cssSelector).join(',');
      let nodes = document.querySelectorAll(cssSelectors) as NodeListOf<HTMLElement>;
      nodes.forEach(node => {
        const { position, left, top } = node.style;
        if (left !== '-99999px') {
          const style = { position, left, top };
          node.setAttribute(`data-ffc-${ffc_special_value}`, JSON.stringify(style));
          Object.assign(node.style, { position: 'absolute', left: '-99999px', top: '-99999px' });
        }
      });
    }
  }

  // show items (revert hiding)
  if (groupedItems[ffResult] && groupedItems[ffResult].length > 0) {
    revertRules(groupedItems[ffResult]);
  }
}

async function zeroCodeSettingsCheckVariation(zeroCodeSettings: IZeroCode[], observer: MutationObserver) {
  for(let zeroCodeSetting of zeroCodeSettings) {
    const effectiveItems = zeroCodeSetting.items?.filter(it => isUrlMatch(UrlMatchType.Substring, it.url));
    
    if (!!effectiveItems && effectiveItems.length > 0) {
      const result = FFCJsClient.variation(zeroCodeSetting.featureFlagKey, ffc_special_value);

      if (result !== ffc_special_value) {
        observer.disconnect();
        applyRules(effectiveItems, result);
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      }
    } else {
      if (zeroCodeSetting.items && zeroCodeSetting.items.length > 0) {
        observer.disconnect();
        revertRules(zeroCodeSetting.items);
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      }
    }
  }
}

async function doZeroCodeSettings(envSecret: string) {
  let zeroCodeSettings = await getZeroCodeSettings(envSecret);
  if (!!zeroCodeSettings) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;//浏览器兼容

    var callback = function (mutationsList, observer) {
      //const list = mutationsList.filter(m => m.type !== 'attributes' || m.attributeName !== 'class' || )
      if (mutationsList && mutationsList.length > 0) {
        zeroCodeSettingsCheckVariation(zeroCodeSettings, observer);
      }
    };

    const observer = new MutationObserver(callback);
    await zeroCodeSettingsCheckVariation(zeroCodeSettings, observer);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  }
}
/********************************Zero code setting *************************************/
/********************************experiment metric setting *************************************/
async function getActiveExperimentMetricSettings(envSecret: string): Promise<IExptMetricSetting[] | []> {
  const exptMetricSettingLocalStorageKey = 'ffc_expt_metric_';
  try {
    const response = await fetch(`${_baseUrl}/api/experiments/${envSecret}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        }
    });

    const result = await response.text();

    localStorage.setItem(exptMetricSettingLocalStorageKey, result);
    return JSON.parse(result);
  } catch(error) {
    console.log(error);
    return !!localStorage.getItem(exptMetricSettingLocalStorageKey) ? JSON.parse(localStorage.getItem(exptMetricSettingLocalStorageKey) as string) : [];
  }
}

/********************************experiment metric setting *************************************/
export const FFCJsClient : IFFCJsClient = {
  async trackPageViewsAndClicks (envSecret: string) {
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

    const exptMetricSettings = await getActiveExperimentMetricSettings(envSecret);
    const pageViewSetting = exptMetricSettings
      .find(em => em.eventType === EventType.PageView && em.targetUrls.findIndex(t => isUrlMatch(t.matchType, t.url)) !== -1);

    if (!!pageViewSetting) {
      const data = [{
        type: 'PageView',
        route: window.location.href,
        eventName: pageViewSetting.eventName
      }];

      self.trackAsync(data);
    }

    window.addEventListener("locationchange", function () {
      // page view
      const pageViewSetting = exptMetricSettings
      .find(em => em.eventType === EventType.PageView && em.targetUrls.findIndex(t => isUrlMatch(t.matchType, t.url)) !== -1);

      if (!!pageViewSetting) {
        const data = [{
          route: window.location.href,
          eventName: pageViewSetting.eventName
        }];
  
        self.trackAsync(data);
      }
    });

    document.addEventListener('click', function(e) {
      const clickSetting = exptMetricSettings
      .find(em => em.eventType === EventType.Click && em.targetUrls.findIndex(t => isUrlMatch(t.matchType, t.url)) !== -1);

      if (!!clickSetting) {
        const target = e.target as Element;
        if (target?.closest(clickSetting.elementTargets)) {
          const data = [{
            type: 'Click',
            route: window.location.href,
            eventName: clickSetting.eventName
          }];
    
          self.trackAsync(data);
        }
      }
    });
  },
  initialize: function (environmentSecret: string, user?: IFFCUser, option?: IOption) {
    _environmentSecret = environmentSecret;
    if (user) {
      _user = Object.assign({}, _user, user);
    }
    
    _baseUrl = option?.baseUrl || _baseUrl;
    _appType = option?.appType || _appType;
    _throttleWait = option?.throttleWait || _throttleWait;

    doZeroCodeSettings(_environmentSecret);
    this.trackPageViewsAndClicks(_environmentSecret);
  },
  initUserInfo (user) {
    if (!!user) {
      _user = Object.assign({}, _user, user);
    }
  },
  trackCustomEventAsync: async (data: IFFCCustomEvent[]) => {
    data = data || [];
    return await FFCJsClient.trackAsync(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
  },
  trackCustomEvent: (data: IFFCCustomEvent[]) => {
    data = data || [];
    return FFCJsClient.track(data.map(d => Object.assign({}, d, {type: 'CustomEvent'})));
  },
  trackAsync: async (data: IFFCCustomEvent[]): Promise<boolean> => {
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
  track: (data: IFFCCustomEvent[]): boolean => {
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
  variationAsync: throttleAsync(async (featureFlagKey: string, defaultResult?: string): Promise<string> => {
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
    }),
  variation: throttle((featureFlagKey: string, defaultResult?: string): string => {
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
  })
};
