export interface LocationInfo {
    href: string;
    origin: string;
    hash: string;
    pathname: string;
}

export interface ClickEvent extends LocationInfo {
    clickType: string;
    innerText: string;
    cssSelector: string;
    elementType: string;
}

export interface CustomEvent {
    eventName: string;
    eventDescription: string;
    eventValue: string;
}

export interface PageViewEvent extends LocationInfo {}

export interface PageStayDurationEvent extends LocationInfo {
    duration: number;
}

export interface trackParam {
    userKey: string;
    clickEvent?: ClickEvent;
    pageViewEvent?: PageViewEvent;
    customEvent?: CustomEvent;
    pageStayDurationEvent?: PageStayDurationEvent;
}