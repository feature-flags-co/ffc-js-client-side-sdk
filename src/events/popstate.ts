import { PageStop } from "../classes/page_stop";
import { eventsListener } from "../listenerEvent";

export const listenerPopstate = (pageStop: PageStop, that: eventsListener) => {

    window.addEventListener("popstate", () => {
        let params = pageStop.popStateCheck(window.location);

        that.requestData({
            pageViewEvent: params?.pageviewParams
        })
        
        that.requestData({
            pageStayDurationEvent: params?.pagestopParams
        })
    })
}
