import { PageStop } from "../classes/page_stop";
import { eventsListener } from "../listenerEvent";

export const listenerPopstate = (pageStop: PageStop, that: eventsListener) => {

    window.addEventListener("popstate", () => {
        let params = pageStop.popStateCheck(window.location);

        that.requestData({
            userKey: that.getUserInfo().key,
            UtcTimeStampFromClientEnd: Date.now(),
            pageViewEvent: params?.pageviewParams
        })
        
        that.requestData({
            userKey: that.getUserInfo().key,
            UtcTimeStampFromClientEnd: Date.now(),
            pageStayDurationEvent: params?.pagestopParams
        })
    })
}
