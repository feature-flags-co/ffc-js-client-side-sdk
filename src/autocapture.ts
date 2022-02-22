import Ffc from "./ffc";
import { eventHub } from "./events";
import store from "./store";
import { featureFlagEvaluatedTopic } from "./constants";
import { networkService } from "./network.service";
import { EventType, FeatureFlagType, ICssSelectorItem, IExptMetricSetting, IZeroCode, UrlMatchType } from "./types";
import { extractCSS, groupBy, isUrlMatch } from "./utils";

declare global {
  interface Window {
    WebKitMutationObserver:any;
    MozMutationObserver: any;
  }
}

const ffcSpecialValue = '___071218__';

class AutoCapture {

  constructor() {}

  async init() {
    const settings = await Promise.all([networkService.getActiveExperimentMetricSettings(), networkService.getZeroCodeSettings()]);
  
    await Promise.all([this.capturePageViews(settings[0]), this.trackZeroCodingAndClicks(settings[1], settings[0])]);
    const html = document.querySelector('html');
    if (html) {
      html.style.visibility = 'visible';
    }
  }

  private async capturePageViews(exptMetricSettings: IExptMetricSetting[]) {
    const self: AutoCapture = this;
    history.pushState = (f => function pushState(this: any) {
      const argumentsTyped: any = arguments;
      const ret = f.apply(this, argumentsTyped);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.pushState);

    history.replaceState = (f => function replaceState(this: any) {
      const argumentsTyped: any = arguments;
      const ret = f.apply(this, argumentsTyped);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    })(history.replaceState);

    window.addEventListener('popstate', () => {
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

      await networkService.track(data);
    }

    window.addEventListener("locationchange", async function () {
      const pageViewSetting = exptMetricSettings
        .find(em => em.eventType === EventType.PageView && em.targetUrls.findIndex(t => isUrlMatch(t.matchType, t.url)) !== -1);

      if (!!pageViewSetting) {
        const data = [{
          route: window.location.href,
          eventName: pageViewSetting.eventName
        }];

        await networkService.track(data);
      }
    });
  }

  private async trackZeroCodingAndClicks(zeroCodeSettings: IZeroCode[], exptMetricSettings: IExptMetricSetting[]) {
    const self = this;
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;//浏览器兼容
  
    var callback = async function (mutationsList, observer) {
      if (mutationsList && mutationsList.length > 0) {
        observer.disconnect();
        await Promise.all([self.bindClickHandlers(exptMetricSettings), self.zeroCodeSettingsCheckVariation(zeroCodeSettings, observer)]);
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      }
    };
  
    const observer = new MutationObserver(callback);
    await Promise.all([this.bindClickHandlers(exptMetricSettings), this.zeroCodeSettingsCheckVariation(zeroCodeSettings, observer)]);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  }

  private async bindClickHandlers(exptMetricSettings: IExptMetricSetting[]) {
    const clickHandler = (event) => {
      var target = event?.currentTarget as any;
      const data = [{
        type: 'Click',
        route: window.location.href,
        eventName: target.dataffceventname
      }];
    
      networkService.track(data);
    }

    const clickSetting = exptMetricSettings
    .find(em => em.eventType === EventType.Click && em.targetUrls.findIndex(t => isUrlMatch(t.matchType, t.url)) !== -1);
  
    if (!!clickSetting) {
      const nodes = document.querySelectorAll(clickSetting.elementTargets);
      nodes.forEach(node => {
        node['dataffceventname'] = clickSetting.eventName;
        node.removeEventListener('click', clickHandler);
        node.addEventListener('click', clickHandler);
      });
    }
  }

  private async zeroCodeSettingsCheckVariation(zeroCodeSettings: IZeroCode[], observer: MutationObserver) {
    for(let zeroCodeSetting of zeroCodeSettings) {
      const effectiveItems = zeroCodeSetting.items?.filter(it => isUrlMatch(UrlMatchType.Substring, it.url));
      
      if (zeroCodeSetting.featureFlagType === FeatureFlagType.Pretargeted) {
        // 客户已经做好用户分流
        for (let item of effectiveItems) {
          let node = document.querySelector(item.cssSelector) as HTMLElement;
          if (node !== null && node !== undefined) {
            // this send feature flag insights data
            const featureFlag = store.getFeatureFlag(zeroCodeSetting.featureFlagKey);
            if (!!featureFlag) {
              eventHub.emit(featureFlagEvaluatedTopic, {
                id: featureFlag.id,
                timestamp: Date.now(),
                sendToExperiment: featureFlag.sendToExperiment,
                variation: featureFlag.variationOptions.find(o => o.value === item.variationValue)
              });
            }
          }
        }
      } else {
        if (!!effectiveItems && effectiveItems.length > 0) {
          const result = Ffc.variation(zeroCodeSetting.featureFlagKey, ffcSpecialValue);
  
          if (result !== ffcSpecialValue) {
            this.applyRules(effectiveItems, result);
          }

          Ffc.on(`ff_update:${zeroCodeSetting.featureFlagKey}`, () => {
            const result = Ffc.variation(zeroCodeSetting.featureFlagKey, ffcSpecialValue);
            if (result !== ffcSpecialValue) {
              this.applyRules(effectiveItems, result);
            }
          });
        } else {
          if (zeroCodeSetting.items && zeroCodeSetting.items.length > 0) {
            this.revertRules(zeroCodeSetting.items);
          }
        }
      }
    }
  }

  private revertRules (items: ICssSelectorItem[]) {
    const cssSelectors = items.map(it => it.cssSelector).filter((v, i, a) => a.indexOf(v) === i).join(','); // the filter function returns unique values
    let nodes = document.querySelectorAll(cssSelectors) as NodeListOf<HTMLElement>;
    nodes.forEach(node => {
      const style = {};
      if (node.style.display === 'none') {
        style['display'] = 'block';
      }
  
      const rawStyle = node.getAttribute(`data-ffc-${ffcSpecialValue}`);
      if (rawStyle !== null && rawStyle !== '') {
        Object.assign(style, JSON.parse(rawStyle)); 
      }
  
      Object.assign(node.style, style);
    });
  }
  
  private applyRules(items: ICssSelectorItem[], ffResult: string) {
    const groupedItems: { [key: string]: ICssSelectorItem[] } = groupBy(items, 'variationValue');
    
    // hide items
    for (let [variationValue, itms] of Object.entries(groupedItems)) {
      if (variationValue !== ffResult) {
        const cssSelectors = (itms as ICssSelectorItem[]).map(it => it.cssSelector).filter((v, i, a) => a.indexOf(v) === i).join(','); // the filter function returns unique values
        let nodes = document.querySelectorAll(cssSelectors) as NodeListOf<HTMLElement>;
        nodes.forEach(node => {
          const { position, left, top } = node.style;
          if (left !== '-99999px') {
            const style = { position, left, top };
            node.setAttribute(`data-ffc-${ffcSpecialValue}`, JSON.stringify(style));
            Object.assign(node.style, { position: 'absolute', left: '-99999px', top: '-99999px' });
          }
        });
      }
    }
  
    // show items (revert hiding)
    if (groupedItems[ffResult] && groupedItems[ffResult].length > 0) {
      this.showOrModifyElements(groupedItems[ffResult]);
    }
  }

  private showOrModifyElements(items: ICssSelectorItem[]) {
    items?.forEach(item => {
      let nodes = document.querySelectorAll(item.cssSelector) as NodeListOf<HTMLElement>;
      if (item.action === 'show' || item.action === 'modify') {
        nodes.forEach(node => {
          const style = {};
          if (node.style.display === 'none') {
            style['display'] = 'block';
          }
      
          const rawStyle = node.getAttribute(`data-ffc-${ffcSpecialValue}`);
          if (rawStyle !== null && rawStyle !== '') {
            Object.assign(style, JSON.parse(rawStyle)); 
          }
      
          Object.assign(node.style, style);
  
          if (item.action === 'modify') {
            // apply properties
            item.htmlProperties?.forEach(p => {
              node.setAttribute(p.name, p.value);
            });
  
            // apply content
            if (item.htmlContent) {
              node.innerHTML = item.htmlContent;
            }
            
            // apply style
            extractCSS(item.style).forEach(css => {
              node.style[css.name] = css.value;
            })
          }
        });
      }
    });
  }
}

export default new AutoCapture();
