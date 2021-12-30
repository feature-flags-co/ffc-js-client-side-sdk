import { locationSortout } from "../utils/locationSortout";

export class PageStop {
    private initURL: string = "";
    private lastURL: string = "";
    private currentURL: string = "";
    private startTime: number = 0;
    private endTime: number = 0;
    private leaveStartTime: number = 0;
    private leaveEndTime: number = 0;

    private location: {
        href: string,
        origin: string,
        pathname: string,
        hash: string
    }

    constructor() {
        this.location = {
            href: "",
            origin: "",
            pathname: "",
            hash: ""
        }
    }

    public init(location: any) {
        this.initURL = location.href;
        this.currentURL = location.href;
        this.lastURL = "";
        this.location = {...locationSortout()};

        this.startTime = Date.now();

        // 发送当前页面的 pageview 参数
        return this.location;
    }

    /**
     * 地址发生改变
     *      计算上一个页面的停留时间
     *      发布当前页面的 pageview 参数
     * @param location 
     */
    public popStateCheck(location: any) {
        const href = location.href;

        if(href !== this.currentURL) {
            
            // 计算上一个路由的停留时间
            this.endTime = Date.now();

            let start_end = this.endTime - this.startTime;
            let leaveTime = this.leaveEndTime - this.leaveStartTime;
            let stopTime = start_end - leaveTime;

            // pageview 参数，当前 location
            let pageviewParams = {
                ...locationSortout()
            }

            // pagestop 参数，上一个 location
            let pagestopParams = {
                ...this.location,
                duration: stopTime
            }

            // 赋值新的类成员属性值
            this.lastURL = this.currentURL;
            this.currentURL = href;
            this.location = {...locationSortout()};
            this.startTime = Date.now();
            this.endTime = 0;
            this.leaveStartTime = 0;
            this.leaveEndTime = 0;

            return {
                pageviewParams, pagestopParams
            }
        } else {
            return null;
        }
    }

    /**
     * 切换窗口
     */
    public switchWindow() {
        let flag = document.visibilityState;
        if(flag === "hidden") {
            this.leaveStartTime = Date.now();
        } else if(flag === 'visible') {
            this.leaveEndTime = Date.now();
        }
    }
}