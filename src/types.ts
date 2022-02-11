export interface IOption {
    secret: string,
    useAnonymousUser?: boolean,
    devMode?: boolean,
    api?: string,
    streamEndpoint?: string,
    appType?: string,
    user?: IUser
  }
  
export interface IUser {
  userName: string,
  email: string,
  country?: string,
  id: string,
  customizeProperties?: ICustomizedProperty[]
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

export interface IFeatureFlag {
  id: string, // the keyname
  variation: string,
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