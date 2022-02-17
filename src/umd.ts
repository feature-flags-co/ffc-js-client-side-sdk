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
// import pkg from '../package.json';
import { logger } from './logger';

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

async function printVersion() {
  const pkg = await import('../package.json');
  logger.logDebug(pkg.version);
}

printVersion();

export { Ffc }
