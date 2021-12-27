import { PageStop } from "../classes/page_stop"

export const listenerSwitchWindow = (pageStop: PageStop) => {

    window.addEventListener("visibilitychange", () => {
        pageStop.switchWindow();
        console.log(pageStop)
    })
}