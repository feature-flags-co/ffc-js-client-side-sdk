export interface IOption {
  secret: string,
  anonymous?: boolean,
  boostrap?: IFeatureFlag[],
  devModePassword?: string,
  api?: string,
  appType?: string,
  user?: IUser,
  enableDataSync?: boolean
}

export interface IUser {
  userName: string,
  email: string,
  country?: string,
  id: string,
  customizedProperties?: ICustomizedProperty[]
}

export interface ICustomizedProperty {
  name: string,
  value: string | number | boolean
}

export interface IVariationOption {
  id: number,
  value: string
}

export interface IFeatureFlagVariation {
  id: string,
  sendToExperiment: boolean
  timestamp: number,
  variation: {
    id: number,
    value: string,
  }
}

export interface IFeatureFlagBase {
  id: string, // the keyname
  variation: string,
}

export interface IFeatureFlag extends IFeatureFlagBase{
  sendToExperiment: boolean,
  timestamp: number,
  variationOptions: IVariationOption[]
}

export interface IDataStore {
  featureFlags: { [key: string]: IFeatureFlag }
}

export enum StreamResponseEventType {
  full = 'full',
  patch = 'patch'
}

export enum FeatureFlagUpdateOperation {
  update = 'update',
  createDevData = 'createDevData',
  devDataCreated = 'devDataCreated'
}

export interface IStreamResponse {
  eventType: StreamResponseEventType,
  userKeyId: string,
  featureFlags: IFeatureFlag[]
}

export interface ICustomEvent {
  eventName: string,
  numericValue?: number
}

/******************* auto capture begin********************************** */
export interface IZeroCode {
  envId: number,
  envSecret: string,
  isActive: boolean,
  featureFlagId: string,
  featureFlagType: FeatureFlagType,
  featureFlagKey: string,
  items: ICssSelectorItem[]
}

export interface IHtmlProperty {
  id: string,
  name: string,
  value: string
}

export interface ICSS {
  name: string,
  value: string | number
}

export interface ICssSelectorItem {
  cssSelector: string,
  variationValue: string,
  variationOptionId: number,
  action: string,
  htmlProperties: IHtmlProperty[],
  htmlContent: string,
  style: string,
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
/******************* auto capture end********************************** */