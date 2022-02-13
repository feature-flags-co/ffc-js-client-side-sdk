# JavaScript client side SDK


## Introduction
This is the JavaScript client side SDK for the feature management platform [feature-flags.co](feature-flags.co). We will document all the methods available in this SDK, and detail how they work.

Be aware, this is a client side SDK, it is intended for use in a single-user context, which can be mobile, desktop or embeded applications. This SDK can only be ran in a browser environment, it is not suitable for NodeJs applications, server side SDKs are available in our other repos.

## Main work of this SDK
- Makes feature flags avaible to the client side code
- Sends feature flags usage, click, pageview and custom events for the insights and A/B/n testing.

## Getting started
### Install
npm
  ```
  npm install ffc-js-client-sdk
  ```

yarn
```
yarn add ffc-js-client-sdk
```

browser (you can also self host the SDK alongside your other JavaScript code in production environment)
```
<script src="https://assets.feature-flags.co/sdks/ffc-sdk.js" ></script>
```

To import the SDK:
```javascript
// Using ES2015 imports
import { Ffc } from 'ffc-js-client-sdk/esm';

// Using TypeScript imports
import { Ffc } from 'ffc-js-client-sdk/esm';
```

If using typescipt and seeing the following error:
```
Cannot find module 'ffc-js-client-sdk/esm'. Did you mean to set the 'moduleResolution' option to 'node', or to add aliases to the 'paths' option?
```
just add this in your tsconfig.json file
```json
  "compilerOptions": {
    "moduleResolution": "node"
  },
```

### Initializing the SDK
Before initializing the SDK, you need to get the client-side env secret of your environment from our SaaS platform.

```javascript
const option = {
    secret: 'your env secret',
    user: {
      userName: 'the user's user name',
      id: 'the user's unique identifier'
    }
};

Ffc.init(option);
```

All the parameters available in option:
- **secret**: the client side secret of your environment. **mandatory**
- **useAnonymousUser**: true if you want to use a anonymous user, which is the case before user login to your APP. If that is your case, the user can be setted later with the **identify** method after the user has logged in. The default value is false. **not mandatory**
- **boostrap**: init the SDK with feature flags, this will trigger the ready event immediately instead of requesting from the remote. **not mandatory**
- **devMode**: true if you want to init the SDK with developer mode, this will add an button(icon) on the bottom right of the screen, which allows you to manipulate all the feature flags locally during development. It can also be activated after initialization by a commande in the browser console or a querystring in your url. The default value is false. **not mandatory**
- **api**: the API url of the server, set it only if you are self hosting the back-end. **not mandatory**
- **appType**: the app type, the default value is javascript, **not mandatory**
- **user**: the user connected to your APP, can be ignored if **useAnonymousUser** equals to true. 
  - **userName**: the user name. **mandatory**
  - **id**: the unique identifier. **mandatory**
  - **email**: can be useful when you configure your feature flag rules. **not mandatory**
  - **country**: can be useful when you configure your feature flag rules. **not mandatory**
  - **customizeProperties**: any customized properties you want to send to the back end. It is extremely powerful when you define targeting rules or segments. **not mandatory**
     - it must have the following format:
     ```json
      [{
        "name": "the name of the property",
        "value": "the value of the property"
      }]
     ```

#### Initialization delay
Initializing the client makes a remote request to feature-flags.co, so it may take 100 milliseconds or more before the SDK emits the ready event. If you require feature flag values before rendering the page, we recommend bootstrapping the client. If you bootstrap the client, it will emit the ready event immediately.
### Activate developer mode
Developer mode is a powerful tool we created to manipulate the feature flags locally instead of modifying them on [feature-flags.co](feature-flags.co).
Three ways to activate the developer mode.
- from query string
add this to your url before loading the page: **?devmode=true**

- from browser console
execute this command in the browser console
```javascript
  localStorage.setItem('ffcdevmode', true);
```

- from the init method
```javascript
  // define the option with the devMode parameter
  const option = {
    ...
    devMode: true,
    ...
  }

  Ffc.init(option);
```

### bootstrap
If you already have the feature flags available, two ways to pass them to the SDK instead of requesting from the remote.
- by the **init** method
```javascript
  // define the option with the bootstrap parameter
  const option = {
    ...
    bootstrap = [{
      id: string, // the keyname
      variation: string,
      sendToExperiment: boolean,
      timestamp: number,
      isArchived: boolean,
      variationOptions: [{
        id: number,
        value: string
      }]
    }]
    ...
  }

  Ffc.init(option);
```

- by the **bootstrap** method 
```javascript
const featureflags = [{
  id: string, // the keyname
  variation: string,
  sendToExperiment: boolean,
  timestamp: number,
  isArchived: boolean,
  variationOptions: [{
    id: number,
    value: string
  }]
}]

Ffc.bootstrap(featureflags);
```

To find out when the client is ready, you can use one of two mechanisms: events or promises.

The client object can emit JavaScript events. It emits a ready event when it receives initial flag values from feature-flags.co. You can listen for this event to determine when the client is ready to evaluate flags.

```javascript
Ffc.on('ready', () => {
  var flagValue = Ffc.variation("YOUR_FEATURE_KEY", 'the default value');
});

```

Or, you can use a promise instead of an event. The SDK has a method that return a promise for initialization: waitUntilReady(). The behavior of waitUntilReady() is equivalent to the ready event. The promise resolves when the client receives its initial flag data. As with all promises, you can either use .then() to provide a callback, or use await if you are writing asynchronous code.

```javascript
Ffc.waitUntilReady().then(() => {
  // initialization succeeded, flag values are now available
});
// or, with await:
await Ffc.waitUntilReady();
// initialization succeeded, flag values are now available
```

The SDK only decides initialization has failed if it receives an error response indicating that the environment ID is invalid. If it has trouble connecting to feature-flags.co, it will keep retrying until it succeeds.

### set the user after initialization

```javascript
  Ffc.identify(user);
```

### get the varation value of a feature flag
Two methods to get the variation of a feature flag

```javascript
// Use this method for all cases
var flagValue = Ffc.variation("YOUR_FEATURE_KEY", 'the default value');

// Syntactic sugar of the variation method. Use this method if the options are strings of true or false
var the defaultValue = true; // or false
var flagValue = Ffc.variationBool("YOUR_FEATURE_KEY", defaultValue);
```


