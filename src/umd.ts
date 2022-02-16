// This file is only for umd version

// delay showing of page content
const html = document.querySelector('html');
const waittime = 500;
if (html) {
  html.style.visibility = 'hidden';
  setTimeout(() => html.style.visibility = 'visible', waittime);
}

import Ffc from './ffc';
import { IOption } from './types';

const script = document.querySelector('script[data-ffc-client]');
const envSecret = script?.getAttribute('data-ffc-client')

if (script && envSecret) {
  const option: IOption = {
    secret: envSecret!,
    anonymous: true,
    //api: 'http://localhost:5001/'
  };
  Ffc.init(option);
}

export { Ffc }
