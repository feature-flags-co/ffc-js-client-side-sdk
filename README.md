# ffc-js-client-sdk

## 安装

使用npm安装指令
  ```
  npm install ffc-js-client-sdk --save
  ```
## 在目标项目中引入源代码

### 浏览器 
```
<script src="../node_modules/ffc-js-client-sdk/umd/index.js" ></script>
```

### Typescript 以及支持 import 语法的 JavaScript 

```
import { FFCJsClient } from 'ffc-js-client-sdk/esm';
```
如果显示如下错误:
```
Cannot find module 'ffc-js-client-sdk/esm'. Did you mean to set the 'moduleResolution' option to 'node', or to add aliases to the 'paths' option?
```
请在项目的tsconfig.json 文件中添加
```
  ...
  "compilerOptions": {
    ...
    "moduleResolution": "node"
  },
  ...
```

## Demo

在根目录下打开demo文件夹，使用浏览器打开文件index.html，即可查看demo案例。


## 集成SDK到自己的项目中

### 初始化敏捷开关

```javascript
  // 初始化sdk，传入环境Secret Key和用户信息
  FFCJsClient.initialize('YThmLWRmZjUtNCUyMDIxMDkxNzA3NTYyMV9fMl9fMjJfXzExNl9fZGVmYXVsdF82NTM3Mg==');
```
### 在用户登录后传递用户信息给敏捷开关SDK
```javascript
  // 初始化用户信息，通常这一步会在登录后被调用
  FFCJsClient.initUserInfo({
      userName: 'sdk-sample-js-1252',
      email: '',
      key: 'sdk-sample-js-1252',
      customizeProperties: [
          {
              name: "外放地址",
              value: "?from=zhihu&group=pm"
          }
      ]
  });
```
### 从敏捷开关服务器获取分配给用户的变量值，并根据业务逻辑执行不同的功能模块
```javascript
  const result = FFCJsClient.variation('主页---话术版本', '产品经理版1');
  if (result === '产品经理版1') {
      document.getElementById('version-a').style.display = 'block';
  }
  else if (result === '程序员版1') {
      document.getElementById('version-b').style.display = 'block';
  }
  else if (result === '产品经理版2') {
      document.getElementById('version-c').style.display = 'block';
  }
  else {
      document.getElementById('version-a').style.display = 'block';
  }
```
如果需要同步请求的函数，可以在源码"/src/index.js"文件中寻找"variationAsync"函数

### 捕捉点击按钮的事件(custom event)
```javascript
  await FFCJsClient.trackCustomEventAsync([
    {
      eventName: "开始使用点击事件"
    }
  ]);
如果需要异步请求的函数，可以在源码"/src/index.js"文件中寻找"trackCustomEvent"函数
```
