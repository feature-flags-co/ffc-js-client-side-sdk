// This file is only for umd version

import { FFCJsClient } from "./index";

const script = document.querySelector('script[data-ffc-client]');
const envSecret = script?.getAttribute('data-ffc-client')
if (!script || !envSecret) {
    console.log('data-ffc-client attribute should be set on the feature-flags.co sdk');
} else {
    // delay showing of page content
    const body = document.querySelector('body');
    if (body) {
        body.style.opacity = '0';
        setTimeout(() => body.style.opacity = '1', 200);
    }
    FFCJsClient.initialize(envSecret as string);
}

export { FFCJsClient }
