// This file is only for umd version

// delay showing of page content
const html = document.querySelector('html');
const waittime = 500;
if (html) {
    html.style.visibility = 'hidden';
    setTimeout(() => html.style.visibility = 'visible', waittime);
}

// import { FFCJsClient } from "./index";

import Ffc from './ffc';
import { IOption } from './types';

const script = document.querySelector('script[data-ffc-client]');
const envSecret = script?.getAttribute('data-ffc-client')

if (!script || !envSecret) {
    console.log('data-ffc-client attribute should be set on the feature-flags.co sdk');
} else {
  const option: IOption = {
    secret: envSecret, //'YjRlLWY1YjEtNCUyMDIxMDYwNzA2NTYwOF9fMl9fM19fN19fZGVmYXVsdF84NDNlMw==',
    useAnonymousUser: true,
    //api: 'http://localhost:5001/'
  };
  Ffc.init(option);
}

export { Ffc }
