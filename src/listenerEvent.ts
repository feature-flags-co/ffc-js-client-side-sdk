import { trackParam } from "./classes/interfaces";
import { PageStop } from "./classes/page_stop";
import { listenerClickEvent } from "./events/click"
import { listenerInputEvent } from "./events/input";
import { listenerPopstate } from "./events/popstate";
import { listenerSwitchWindow } from "./events/switch_window";
import { IFFCUser } from "./types";
import { onRequest } from "./utils/request";

let listener: eventsListener | null = null;

export class eventsListener {

    private environmentSecret: string;
    private pageStopObject: PageStop;
    private userInfo: IFFCUser;

    constructor(key: string, user: IFFCUser) {

        this.pageStopObject = new PageStop();
        this.environmentSecret = "MTc1LTAxMzItNCUyMDIxMTAyNTA4NTUwOF9fNTdfXzY5X18xNDdfX2RlZmF1bHRfODY1MjQ=";
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
    public requestData(param: trackParam) {
        onRequest(param, this.environmentSecret);
    }
}

export const addEventsListener = (args: string | null, user: IFFCUser) => {
    if(!listener) {
        listener = new eventsListener(args as string, user);
    } else {
        listener.initUserInfo(user);
    }
}
