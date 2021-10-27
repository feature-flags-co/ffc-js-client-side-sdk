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
    initialize: (environmentSecret: string, user?: IFFCUser, option?: IOption) => void,
    initUserInfo: (user: IFFCUser) => void,
    trackCustomEventAsync: (data: IFFCCustomEvent[]) => Promise<boolean>,
    trackCustomEvent: (data: IFFCCustomEvent[]) => boolean,
    trackAsync: (data: IFFCCustomEvent[]) => Promise<boolean>,
    track: (data: IFFCCustomEvent[]) => boolean,
    sendUserVariationAsync: (featureFlagKey: string, variationOptionId: number) => Promise<void>,
    variationAsync: (featureFlagKey: string, defaultResult?: string) => Promise<string>,
    variation: (featureFlagKey: string, defaultResult?: string) => string
  }
  
  export interface IFFCCustomEvent {
    secret?: string,
    route?: string,
    appType?: string,
    eventName: string,
    numericValue?: number,
    customizedProperties?: IFFCCustomizedProperty[],
    user?: IFFCUser
  }
  
  export interface IOption {
    shouldTrackPageViewsAndClicks: boolean,
    baseUrl?: string,
    appType?: string,
    throttleWait?: number
  }

  export interface IZeroCode {
    envId: number,
    envSecret: string,
    isActive: boolean,
    featureFlagId: string,
    featureFlagType: FeatureFlagType, 
    featureFlagKey: string,
    items: ICssSelectorItem[]
  }
  
  export interface ICssSelectorItem {
    cssSelector: string,
    variationValue: string,
    variationOptionId: number,
    url: string
  }

  export enum FeatureFlagType {
    Classic = 1,
    Pretargeted = 2 // 已经预分流，无需我们的开关做用户分流
  }

  export enum EventType {
    Custom = 1,
    PageView = 2,
    Click = 3
  }

  export enum UrlMatchType {
    Substring = 1
  }
  
  export interface ITargetUrl {
    matchType: UrlMatchType,
    url: string
  }

  export interface IExptMetricSetting {
    eventName: string,
    eventType: EventType,
    elementTargets: string,
    targetUrls: ITargetUrl[]
  }