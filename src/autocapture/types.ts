import { ICustomizedProperty, IUser } from "../types";

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