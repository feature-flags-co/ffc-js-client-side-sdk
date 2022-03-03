import { uuid } from "./utils";

const API_CALL_RESULTS : {[key: string]: string} = {};
const FOOT_PRINTS: string[] = [];
let _throttleWait: number = 5 * 60 * 1000; // millionseconds

class ThrottleUtil {
    private _key: string;

    constructor(){
        this._key = uuid();
    }

    setKey(key: string) {
        this._key = key || this._key;
    }

    throttle(fn: Function, ms: number) {
      let timer:any = 0
      return function(...args) {
        clearTimeout(timer)
        timer = setTimeout(fn.bind(null, ...args), ms || 0)
      }
    }

    throttleAsync (callback: any): any {
      let waiting = false; 
    
      let getFootprint = (args: any): string => {
        const params = args.map(arg => {
          if (
            typeof arg === 'object' &&
            typeof arg !== "function" &&
            arg !== null
          ) {
            if (Array.isArray(arg)) {
              return arg.map(a => ({...a, ...{timestamp: null}}))
            } else {
              return {...arg, ...{timestamp: null}};
            }
          }
    
          return arg;
        });
    
        return this._key + JSON.stringify(params);
      };
    
      return async function (...args) {
        const footprint = getFootprint(args);
        const idx = FOOT_PRINTS.findIndex(f => f === footprint);
        if (!waiting || idx === -1) {
          waiting = true;
          if (idx === -1) {
            FOOT_PRINTS.push(footprint);
          }
          
          API_CALL_RESULTS[footprint] = await callback.apply(null, args);
          
          setTimeout(function () {
              waiting = false;
          }, _throttleWait);
        }
    
        return API_CALL_RESULTS[footprint];
      }
    }
}

export default new ThrottleUtil();


