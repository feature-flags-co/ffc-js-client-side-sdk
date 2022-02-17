import { IOption, IUser } from "./types";

// generate default user info
export function ffcguid() {
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

export function validateUser(user: IUser): string | null {
  const { id, userName } = user;

  if (id === undefined || id === null || id.trim() === '') {
    return 'user id is mandatory';
  }

  if (userName === undefined || userName === null || userName.trim() === '') {
    return 'userName is mandatory';
  }

  return null;
}

export function validateOption(option: IOption): string | null {
  if (option === undefined || option === null) {
    return 'option is mandatory';
  }

  const { secret, anonymous, user } = option;

  if (secret === undefined || secret === null || secret.trim() === '') {
    return 'secret is mandatory in option';
  }

  // validate user
  if (!!anonymous === false && !user) {
    return 'user is mandatory when not using anonymous user';
  }

  if (user) {
    return validateUser(user);
  }

  return null;
}

/******************** draggable begin ************************/
export function makeElementDraggable(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header")!.onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    // e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    // e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
/******************** draggable end ************************/

// add style to html element
export function addCss(element: HTMLElement, style: { [key: string]: string }) {
  for (const property in style) {
    element.style[property] = style[property];
  }
}

/********************** encode text begin *****************************/
const alphabet = {
  "0": "Q",
  "1": "B",
  "2": "W",
  "3": "S",
  "4": "P",
  "5": "H",
  "6": "D",
  "7": "X",
  "8": "Z",
  "9": "U",
}

function encodeNumber(param: number, length: number): string {
  var s = "000000000000" + param;
  const numberWithLeadingZeros = s.slice(s.length - length);
  return numberWithLeadingZeros.split('').map(n => alphabet[n]).join('');
}

// generate connection token
export function generateConnectionToken(text: string): string {
  text = text.replace(/=*$/, '');
  const timestamp = Date.now();
  const timestampCode = encodeNumber(timestamp, timestamp.toString().length);
  // get random number less than the length of the text as the start point, and it must be greater or equal to 2
  const start = Math.max(Math.floor(Math.random() * text.length), 2);

  return `${encodeNumber(start, 3)}${encodeNumber(timestampCode.length, 2)}${text.slice(0, start)}${timestampCode}${text.slice(start)}`;
}

/********************** encode text end *****************************/

const API_CALL_RESULTS : {[key: string]: string} = {};
const FOOT_PRINTS: string[] = [];
let _throttleWait: number = 5 * 60 * 1000; // millionseconds
export function throttleAsync (key: string, callback: any): any {
  let waiting = false; 

  let getFootprint = (args: any): string => {
    const params = args.map(arg => {
      if (
        typeof arg === 'object' &&
        typeof arg !== "function" &&
        arg !== null
      ) {
        if (Array.isArray(arg)) {
          debugger;
          return arg.map(a => ({...a, ...{timestamp: null}}))
        } else {
          debugger;
          return {...arg, ...{timestamp: null}};
        }
      }

      return arg;
    });

    return key + JSON.stringify(params);
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
