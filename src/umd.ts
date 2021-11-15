// This file is only for umd version

import { FFCJsClient } from "./index";

const script = document.querySelector('script[data-ffc-client]');
const envSecret = script?.getAttribute('data-ffc-client')
if (!script || !envSecret) {
    console.log('data-ffc-client attribute should be set on the feature-flags.co sdk');
} else {
    FFCJsClient.initialize(envSecret as string);
}

export { FFCJsClient }
