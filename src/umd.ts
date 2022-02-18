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
import { logger } from './logger';

const script = document.querySelector('script[data-ffc-client]');
const envSecret = script?.getAttribute('data-ffc-client')

if (script && envSecret) {
  const option: IOption = {
    secret: envSecret!,
    anonymous: true,
  };
  Ffc.init(option);
}

logger.logDebug(`ffc version: __VERSION__`);

export { Ffc }
