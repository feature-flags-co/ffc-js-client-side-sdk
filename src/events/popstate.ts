import { PageStop } from "../classes/page_stop";

export const listenerPopstate = (pageStop: PageStop) => {

    window.addEventListener("popstate", (event: PopStateEvent) => {
        pageStop.popStateCheck(window.location);

        console.log(pageStop);

    })
}
