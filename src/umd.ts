// This file is only for umd version

// delay showing of page content
const html = document.querySelector('html');
const waittime = 500;
if (html) {
    html.style.visibility = 'hidden';
    setTimeout(() => html.style.visibility = 'visible', waittime);
}

import { FFCJsClient } from "./index";

const script = document.querySelector('script[data-ffc-client]');
const envSecret = script?.getAttribute('data-ffc-client')

if (!script || !envSecret) {
    console.log('data-ffc-client attribute should be set on the feature-flags.co sdk');
} else {
    FFCJsClient.initialize(envSecret as string);
}

export { FFCJsClient }
