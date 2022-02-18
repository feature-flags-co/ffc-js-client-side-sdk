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
  isArchived: boolean,
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
  version: number,
  eventType: StreamResponseEventType,
  featureFlags: IFeatureFlag[]
}

export interface ICustomEvent {
  secret?: string,
  route?: string,
  appType?: string,
  eventName: string,
  numericValue?: number,
  customizedProperties?: ICustomizedProperty[],
  user?: IUser
}