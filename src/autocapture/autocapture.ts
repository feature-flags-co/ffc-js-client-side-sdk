import { track } from "../network.service";
import { IOption } from "../types";
import { EventType, IExptMetricSetting, UrlMatchType } from "./types";

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



  class AutoCapture {
    constructor(private option: IOption){}

    init() {

    }

    async capturePageViews (exptMetricSettings: IExptMetricSetting[]) {
      const self: AutoCapture = this;
      history.pushState = ( f => function pushState(this: any){
        const argumentsTyped: any = arguments;
        const ret = f.apply(this, argumentsTyped);
        window.dispatchEvent(new Event('pushstate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
      })(history.pushState);
      
      history.replaceState = ( f => function replaceState(this: any){
        const argumentsTyped: any = arguments;
        const ret = f.apply(this, argumentsTyped);
        window.dispatchEvent(new Event('replacestate'));
        window.dispatchEvent(new Event('locationchange'));
        return ret;
      })(history.replaceState);
      
      window.addEventListener('popstate',()=>{
        window.dispatchEvent(new Event('locationchange'))
      });
    
      const pageViewSetting = exptMetricSettings
        .find(em => em.eventType === EventType.PageView && em.targetUrls.findIndex(t => isUrlMatch(t.matchType, t.url)) !== -1);
    
      if (!!pageViewSetting) {
        const data = [{
          type: 'PageView',
          route: window.location.href,
          eventName: pageViewSetting.eventName
        }];
    
        track(self.option.api!, self.option.secret, self.option.appType!, self.option.user!, data);
      }
    
      window.addEventListener("locationchange", function () {
        const pageViewSetting = exptMetricSettings
        .find(em => em.eventType === EventType.PageView && em.targetUrls.findIndex(t => isUrlMatch(t.matchType, t.url)) !== -1);
    
        if (!!pageViewSetting) {
          const data = [{
            route: window.location.href,
            eventName: pageViewSetting.eventName
          }];
    
          track(self.option.api!, self.option.secret, self.option.appType!, self.option.user!, data);
        }
      });
    }
  }