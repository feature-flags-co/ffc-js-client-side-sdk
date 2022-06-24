export type FeatureFlagValue = any;

export interface IFeatureFlagSet {
  [key: string]: FeatureFlagValue;
}

export interface IFeatureFlagChange {
  id: string,
  oldValue: FeatureFlagValue,
  newValue: FeatureFlagValue
}

export interface IOption {
  secret: string,
  anonymous?: boolean,
  bootstrap?: IFeatureFlag[],
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
  value: FeatureFlagValue
}

export interface IFeatureFlagVariation {
  id?: string,
  sendToExperiment?: boolean
  timestamp?: number,
  variation?: {
    id: number,
    value: FeatureFlagValue,
  }
}

export interface IFeatureFlagVariationBuffer {
  id: string,
  timestamp: number,
  variationValue: FeatureFlagValue
}

export enum InsightType {
  featureFlagUsage = 1,
  customEvent = 2,
  pageView = 3,
  click = 4
}

export enum VariationDataType {
  string = 'string',
  boolean = 'boolean',
  number = 'number',
  json = 'json',
}

export interface IInsight extends IFeatureFlagVariation, ICustomEvent {
  insightType: InsightType
}

export interface IFeatureFlagBase {
  id: string, // the keyname
  variation: FeatureFlagValue,
  variationType: VariationDataType
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
  type?: string,
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