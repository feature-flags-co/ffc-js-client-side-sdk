// This file is only for umd version

import { FFCJsClient } from "./index";
import { IFFCUser } from "./types";

// generate default user info
function ffcguid() {
    let ffcHomePageGuid = localStorage.getItem("ffc-guid");
    if (ffcHomePageGuid) {
        return ffcHomePageGuid;
    }
    else {
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem("ffc-guid", uuid);
        return uuid;
    }
}

const script = document.querySelector('script[data-ffc-client]');
const envSecret = script?.getAttribute('data-ffc-client')
if (!script || !envSecret) {
    console.log('data-ffc-client attribute should be set on the feature-flags.co sdk');
} else {
    let sessionId = ffcguid();
    var c_name = 'JSESSIONID';
    if (document.cookie.length > 0) {
        let c_start = document.cookie.indexOf(c_name + "=")
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1
            let c_end = document.cookie.indexOf(";", c_start)
            if (c_end == -1) c_end = document.cookie.length
            sessionId = unescape(document.cookie.substring(c_start, c_end));
        }
    }
    var user: IFFCUser = {
        userName: sessionId,
        email: `${sessionId}@anonymous.com`,
        key: sessionId,
        customizeProperties: []
    };

    FFCJsClient.initialize(envSecret as string, user);
}

export { FFCJsClient }
