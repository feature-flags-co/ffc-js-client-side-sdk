import { eventHub } from "./events";
import { Store } from "./store";
import { FeatureFlagUpdateOperation, IFeatureFlag } from "./types";
import { addCss, makeElementDraggable, preloadImage } from "./utils";

const DevModeEventName: string = 'ffcdevmodechange'
const DevModeStorageKey = 'ffcdevmode';
const DevModeQueryStr = 'devmode';
const DevModeIconBtnUrl = 'https://portal.feature-flags.co/assets/ff_logo.png';

class DevModeEventInit {
  key: string = DevModeStorageKey;
  newValue: any;
  oldValue: any;
}

function createFfEditor(featureFlags: {[key: string]: IFeatureFlag}) {
  const query = (<HTMLInputElement>document.getElementById('ff-editor-search-query'))?.value?.trim() || '';
  let ffEditorContainer = document.getElementById('ffc-ff-editor-container');

  let left = "25%";
  let top = "50px";
  if (ffEditorContainer) {
    left = ffEditorContainer.style.left;
    top = ffEditorContainer.style.top;
    ffEditorContainer.remove();
  }

  const editorTemplate = `
    <div id="ff-editor-header" style="display: flex;justify-content: space-between;cursor:move">
      <div style="font-size: 20px;font-weight: 500;padding: 10px 20px;">Developer mode (play with feature flags locally)</div>
      <div id="ffc-ff-editor-close" style="font-size: 25px;padding: 6px 20px;cursor: pointer;font-weight:600;"></div>
    </div>
    <div id="ff-editor-search-container" style="border-top: 1px solid #f0f0f0;display: flex;justify-content: center;padding-top: 20px;margin-bottom: 15px;">
      <input value="${query}" id="ff-editor-search-query" style="width: 80%;border-radius: 5px;border: 1px solid #222222;padding:0 10px" type="text"/> 
      <button id="ff-editor-search-btn" style="background-color: #fff;border-radius: 20px;padding: 5px 10px;margin-left: 10px;box-sizing: border-box;border: 1px solid #222222;cursor:pointer;">Search</button> 
    </div>
    <div id="ff-editor-content" style="max-height:550px;overflow-y:auto;padding:24px 24px 0 24px;">
      #{{FF}}
    </div>
    <div style="padding: 20px; text-align: right;">
      <button id="ff-editor-reset-btn" style="background-color: #fff;padding: 5px 10px;margin-left: 10px;box-sizing: border-box;border:none;color:#1890ff;cursor:pointer;"> Reset from remote data </button>
    </div>
    <style>
      #ffc-ff-editor-container #ffc-ff-editor-close:after{
        display: inline-block;
        content: "\\00d7"; /* This will render the 'X' */
      }
      #ffc-ff-editor-container #ff-editor-search-btn:hover{
        color: #40a9ff;
        border-color: #40a9ff !important;
      }
      #ffc-ff-editor-container #ff-editor-search-query:hover,#ffc-ff-editor-container #ff-editor-search-query:focus,#ffc-ff-editor-container #ff-editor-search-query:active{
        border-color: #40a9ff !important;
        outline-color: #40a9ff;
      }

      #ffc-ff-editor-container li:hover {
        background: rgba(60,90,100,.04);
      }
    </style>
  `;

  ffEditorContainer = document.createElement("div");
  ffEditorContainer.id = 'ffc-ff-editor-container';
  addCss(ffEditorContainer, {
    "position": "absolute",
    "left": left,
    "top": top,
    "width": "50%",
    "z-index": "9999",
    "border": "1px grey solid",
    "border-radius": "5px",
    "box-shadow": "0 8px 8px -4px lightblue",
    "background-color": "#fff"
  });

  if (query && query.length > 0) {
    const results = Object.keys(featureFlags).filter(key => key.indexOf(query.toLocaleLowerCase()) !== -1).reduce((res, curr) => {
      res[curr] = featureFlags[curr];
      return res;
    }, {}) as {[key: string]: IFeatureFlag};

    ffEditorContainer.innerHTML = editorTemplate.replace(/#{{FF}}/ig, ffListHtml(results));
  } else {
    ffEditorContainer.innerHTML = editorTemplate.replace(/#{{FF}}/ig, ffListHtml(featureFlags));
  }

  // close button click handler
  ffEditorContainer.querySelector("#ffc-ff-editor-close")?.addEventListener('click', (ev) => {
    document.getElementById('ffc-ff-editor-container')?.remove();
  });

  // search click handler
  ffEditorContainer.querySelector("#ff-editor-search-btn")?.addEventListener('click', (ev) => {
    createFfEditor(featureFlags);
  });

  // reset button click
  ffEditorContainer.querySelector("#ff-editor-reset-btn")?.addEventListener('click', (ev) => {
    eventHub.emit(`devmode_ff_${FeatureFlagUpdateOperation.createDevData}`, {});
  });

  // ff variation change
  ffEditorContainer.querySelectorAll("#ffc-ff-editor-container .ff-list").forEach(node => {
    node.addEventListener('change', (ev) => {
      const target = <HTMLSelectElement>ev.target;
      const id: string = target?.getAttribute('data-id') || '';
      const value = target?.value;

      const ff = featureFlags[id];
      const data = {
        id,
        oldValue: ff.variation,
        newValue: value
      };

      eventHub.emit(`devmode_ff_${FeatureFlagUpdateOperation.update}`, {[id]: data});
    });
  });

  document.body.appendChild(ffEditorContainer);
  makeElementDraggable(ffEditorContainer);
}
  
function ffListHtml(featureFlags: {[key: string]: IFeatureFlag}): string {
  return Object.keys(featureFlags).map(key => {
    const ff = featureFlags[key];

    const optionsHtml = ff.variationOptions.map((item) => `<option ${item.value === ff.variation ? 'selected': ''} value="${item.value}">${item.value}</option>`).join('');
    
    return `
      <ul style="list-style-type: none;margin: 0;padding: 0;">
        <li style="display:flex;justify-content:space-between;border-bottom: #f0f0f0 1px solid;padding: 5px 5px;">
          <label style="line-height:30px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;" title="${ff.id}">${ff.id}</label>
          <select data-id="${ff.id}" class="ff-list" style="width:300px;padding:5px">
            ${optionsHtml}
          </select>
        </li>
      </ul>`;
  }).join('');
}

function enableDevMode(featureFlags: {[key: string]: IFeatureFlag}) {    
  // display dev mode icon
  const devModeContainer = document.createElement("div");
  devModeContainer.id = 'ffc-devmode-container';
  addCss(devModeContainer, {
    "position": "absolute",
    "z-index": "9",
    "bottom": "5px",
    "right": "5px"
  });

  const closeBtn = document.createElement("div");
  closeBtn.style.height = '25px';
  closeBtn.innerHTML = `
    <div id="ffc-devmode-close" style="font-size: 25px;padding: 6px 20px;cursor: pointer;font-weight:600;text-align:right"></div>
    <style>
    #ffc-devmode-close:after{
      display: inline-block;
      content: "\\00d7"; /* This will render the 'X' */
    }
  </style>
    `;

  // add onclick listener on close button, turn off dev mode if clicked
  closeBtn.addEventListener('click', () => {
    localStorage.setItem(DevModeStorageKey, `${false}`);
  });

  devModeContainer.appendChild(closeBtn);

  const devModeBtn = document.createElement("img");
  devModeBtn.src = DevModeIconBtnUrl;
  addCss(devModeBtn, {
    "padding": "10px",
    "z-index": "9999",
    "cursor": "pointer",
    "width": "70px",
  });

  // add onclick listener on icon
  devModeBtn.addEventListener('click', () => {
    createFfEditor(featureFlags);
  });

  devModeContainer.appendChild(devModeBtn);
  document.body.appendChild(devModeContainer);

  //makeElementDraggable(devModeContainer);
}

function disableDevMode(){
  document.getElementById("ffc-devmode-container")?.remove();
  document.getElementById("ffc-ff-editor-container")?.remove();
}

function dispatchDevModeEvent () {
  const setItem = localStorage.setItem;
  localStorage.setItem = function (key: string, val: string) {
    if (key === DevModeStorageKey) {
      const devModeStr = localStorage.getItem(DevModeStorageKey) || 'false';
      if (devModeStr !== `${val}`) {
        let event = new CustomEvent<DevModeEventInit>(DevModeEventName, { detail: { newValue: `${val}`, oldValue: devModeStr, key}});
        window.dispatchEvent(event);
      }
    }
    
    const argumentsTyped: any = arguments;
    setItem.apply(this, argumentsTyped);
  }
};

function onDevModeChange (store: Store, oldValue: string, newValue: string) {
  if (oldValue !== newValue) {
    if (newValue === 'true') {
      // make sure the document.body exists before enabling dev mode
      setTimeout(()=> {
        store.isDevMode = true;
        enableDevMode(store.getFeatureFlags());
      }, 0);
    } else {
      // make sure the document.body exists before enabling dev mode
      setTimeout(() => {
        store.isDevMode = false;
        disableDevMode();
      }, 0);
    }
  }
}

export class DevMode {
  constructor(private store: Store){
    preloadImage(DevModeIconBtnUrl);
    eventHub.subscribe(`devmode_ff_${FeatureFlagUpdateOperation.devDataCreated}`, () => {
      createFfEditor(this.store.getFeatureFlags());
    });
  }

  init(activateDevMode?: boolean) {
    let self = this;
    dispatchDevModeEvent();

    window.addEventListener(DevModeEventName, function (e) {
      const { key, oldValue, newValue } = (e as CustomEvent<DevModeEventInit>).detail;
      if (key === DevModeStorageKey) {
        onDevModeChange(self.store, oldValue, newValue);
      }
    });

    // set devmode from the param
    if (activateDevMode !== undefined && activateDevMode !== null) {
      localStorage.setItem(DevModeStorageKey, `${activateDevMode === true}`);
    }

    // set devmode from query string
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const devModeParam = urlParams.get(DevModeQueryStr);
    if (devModeParam !== null && ['true', 'false'].findIndex(ele => ele === devModeParam.toLocaleLowerCase()) > -1)  {
      localStorage.setItem(DevModeStorageKey, devModeParam);
    }
    
    // if already in dev mode since loading of the page
    let devMode = localStorage.getItem(DevModeStorageKey) || 'false';
    if (devMode === 'true') {
      // make sure the document.body exists before enabling dev mode
      setTimeout(() => {
        this.store.isDevMode = true;
        enableDevMode(this.store.getFeatureFlags());
      }, 0);
    }
  } 
}

