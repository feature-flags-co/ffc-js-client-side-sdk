# 敏捷开关 Javascript SDK

本项目为 [敏捷开关 https://www.feature-flags.co](https://www.feature-flags.co) 的 Javascript SDK

## 安装

```
  npm install ffc-js-client-sdk --save
```

## 简易教程

```
  import { FFCJsClient } from 'ffc-js-client-sdk';

  const secret = 'xxx'; // your environment secret
  const user = {
    userName: 'xx',
    email: 'xx@gmail.com',
    key: 'xx@gmail.com',
    customizeProperties: [{
        name: 'xxx',
        value: 'xxx'
      }]
  };
  
  FFCJsClient.initialize(secret, user);
  const result = FFCJsClient.variation('feature-flag-key', 'defaultReturnValue-optional');

  if (result === 'expected-value') {
      // do something
  }

  // track custom event
  const data = [{
    eventName: 'string',
    customizedProperties: [{
      name: 'age',
      value: '16'
    }]
  },
  {
    eventName: 'string1',
    customizedProperties: [{
      name: 'sex',
      value: 'W'
    }]
  }];
	
  FFCJsClient.trackCustomEvent(data);

```