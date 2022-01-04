import { trackParam } from "./classes/interfaces";
import { PageStop } from "./classes/page_stop";
import { listenerClickEvent } from "./events/click"
import { listenerInputEvent } from "./events/input";
import { listenerPopstate } from "./events/popstate";
import { listenerSwitchWindow } from "./events/switch_window";
import { IFFCUser } from "./types";
import { onRequest } from "./utils/request";

export class eventsListener {

    private environmentSecret: string;
    private path: string = "/api/public/analytics/userbehaviortrack";
    private url: string = "";
    private pageStopObject: PageStop;
    private userInfo: IFFCUser;

    constructor(key: string, url: string, user: IFFCUser) {

        this.pageStopObject = new PageStop();
        this.environmentSecret = key;
        this.url = url;
        this.userInfo = {...user};

        listenerClickEvent(this);
        listenerInputEvent(this);
        listenerPopstate(this.pageStopObject, this);
        listenerSwitchWindow(this.pageStopObject);

        // 加载时
        window.addEventListener("load", () => {
            let pageviewParams = this.pageStopObject.init(window.location);
            
            this.requestData({
                userKey: this.userInfo.key,
                UtcTimeStampFromClientEnd: Date.now(),
                pageViewEvent: pageviewParams
            })
        })
    }

    // 初始化用户信息
    public initUserInfo(user: IFFCUser) {
        this.userInfo = {...user};
    }

    // 获取用户信息
    public getUserInfo() {
        return this.userInfo;
    }

    // 向后台传递数据
    public requestData(param: any) {
        let _param: trackParam = {
            ...param,
            userKey: this.getUserInfo().key,
            reRequestTime: 0,
            reRequestTimes: 0
        }

        onRequest(_param, this.environmentSecret, `${this.url}${this.path}`);
    }

    // customEvent
    public track(name: string, descript: string, value: string) {
        this.requestData({
            userKey: this.userInfo.key,
            customEvent: {
                eventName: name,
                eventDescription: descript,
                eventValue: value
            }
        })
    }
}
