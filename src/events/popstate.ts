import { PageStop } from "../classes/page_stop";

export const listenerPopstate = (pageStop: PageStop) => {

    window.addEventListener("popstate", () => {
        let params = pageStop.popStateCheck(window.location);

        console.log(pageStop);
        console.log(params);
    })
}
