# create-react-app

[TOC]

create-react-app执行eject以后的一点自定义调整

- 创建项目`npx create-react-app my-app`
- 支持typescript`npx create-react-app my-app --typescript`
- 添加TS类型定义(说明)文件`npm install --save typescript @types/node @types/react @types/react-dom @types/jest`

## 1、添加了jsconfig.json & 关于jsconfig.json的说明
 
[jsconfig.json作用](https://s0code0visualstudio0com.icopy.site/docs/languages/jsconfig)

> jsconfig.json文件的存在表示该目录是Javascript项目的根。jsconfig.json文件指定了根文件以及Javascript语言服务提供的功能的选项。

- 如果项目的工作空间中没有jsconfig.json文件，则默认会排除node_modules文件夹

```javascript
{
  "compilerOptions": {
    "module": "commonjs", // 生成模块代码时指定模块系统
    "target": "es6", // 指定要使用的默认库
    "experimentalDecorators": true, // 为建议的ES装饰器提供支持
    "baseUrl": ".", // 基本目录，用于解析非相对模块的名称(即paths是以哪个相对路径为基准的，这里是以config.json所在的目录为基准)
    "paths": {} // 指定要相对于baseUrl选项计算的路径映射(配置以后可以告诉编辑器对应的别名如src去哪里解析。alias需要配合webpach配置，webpack中配置的alias是为了告诉babel或eslint去哪里解析别名下的文件)
  },
  "exclude": ["node_modules"], // exclude属性告诉语言服务哪些文件不属于源代码，这样可以使性能保持较高水平
  "include": ["src/**/*"], // 显式指定include属性以后，则仅包含指定的文件
}
```

### 1.1、编辑器别名声明

- 为了让编辑器知道别名对应的路径去哪里解析，需要在config.json中配置出来
- 为了让babel或eslint知道对应的路径去哪里解析，需要在webpack的alisa中配置出来

```javascript
// config.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "ClientApp/*": ["./ClientApp/*"]
    }
  }
}

// 在编辑器中使用alias
import Something from 'ClientApp/foo';
```

## 2、启用装饰器

### 2.1、添加babel-plugin的支持

- 项目需要eject，然后添加对应的支持配置到bebel-config

[参考-掘金](https://juejin.im/post/5c9210dae51d456ba9407daa)

```javascript
// 需要在package.json添加对应的babel配置
// 讲道理来说的话，添加.babelrc应该是一样的
"babel": {
    "presets": [
      "react-app"
    ],
    "plugins": [
        [
            "@babel/plugin-proposal-decorators",
            { "legacy": true }
        ]
    ]
}
```

### 2.2、解决vscode对装饰器特性的报错

- 在vscode设置-首选项-工作区-勾选Implicit Project Config: Experimaental Decorators
- 此时setting.json中会多出{experimentalDecorators”: true}
此时即会以项目根目录中的jsconfig.json或tsconfig.json中的设置为准。
- 添加jsconfig.json配置如下

```javascript
{
  “compilerOptions”: {
    “emitDecoratorMetadata”: true,
    “experimentalDecorators”: true
  }
}
```

## 3、在create-react-app中使用mobx：store+contexts+hooks方案

- 依赖项：mobx、react.Context、mobx-react-lite(可选)

### 3.1、创建一个或多个store并导出

- path：store/index.js

```javascript
import { observable, action, computed } from 'mobx'

export class CounterStore {
  @observable
  count = 0

  @action
  increment() {
    this.count++
  }

  @computed
  get doubleCount() {
    return this.count * 2
  }
}

export const counterStore = new CounterStore();
```

### 3.2、创建Context

- path：contexts/index.js
- 创建StoresContext并导出，后代组件在`useContext`时可以得到包含`counterStore`的对象

```javascript
import React from 'react';
import { counterStore } from 'src/store';

export const StoresContext = React.createContext({
  counterStore,
})
```

### 3.3、封装为hooks函数

- 由于多组建都需要使用`useContext`，所以将其直接封装为hook函数
- path：hooks/useStores.js
- 通过`useStores`获取`React.createContext`给的初始值对象(前提是没有使用`StoresContext.Provider`组件，如果使用了该组件，则必须显式赋值给`StoresContext.Provider`的value，否则默认值为`undefined`，因为此时`StoresContext.Provider`的value为`undefined`)

```javascript
mport React from 'react'
import { StoresContext } from 'src/contexts'

export const useStores = () => React.useContext(StoresContext)
```

### 3.4、后代组件获取store并调用action修改状态，使用`mobx-react-lite`更新组件

- 通过`useStores`获取`state`进行展示，调用`action`修改`store`状态，会被`useOberver`监听到，并更新组件

```javascript
import React from 'react';
import { useStores } from 'src/hooks/user-store';
import { useObserver } from 'mobx-react-lite';

const Counter = () => {
  const { counterStore } = useStores();

  const handleIncrement = () => {
    counterStore.increment();
  }

  return useObserver(() => (
    <div>
      <p>count: {counterStore.count}</p>
      <button onClick={handleIncrement}>add</button>
    </div>
  ))
}

export default Counter;
```

### 3.5、总结

- `mobx-react-lite`是`mobx-react`的轻量版，增加了对函数式组件`hooks`的支持
- 这里只用到了`mobx-react-lite`的`useOberver`API，其他常用的还有`useLocalStore observer`等。[参考文档](https://mobx-react.js.org/)，[npm](https://www.npmjs.com/package/mobx-react-lite)


## 4、使用styled-components

- 安装`npm i styled-components --save`

### 4.1、添加normalize.css

[参考github](https://github.com/sergeysova/styled-normalize)

- 安装`npm i normalize.css --save`

```javascript
// App.js
import { createGlobalStyle } from 'styled-components';
import normalizeCss from 'normalize.css';

const GlobalStyles = createGlobalStyle`
  ${normalizeCss};
`

export default function() {
  return (
    <div>
      <GlobalStyles />
    </div>
  )
}
```

### 4.2、styled-componets主题方案

```javascript
// src/styles/theme
export const themes = {
  Light: {
    Base0: '#F8F9FB',
  },
  DarkBlue: {
    Base0: '#080B17',
  },
  Dark: {
    Base0: '#000000',
  },
}
export default themes;
```

- 通过`ThemeProvider`，使后代css-in-js可以通过`background-color: ${p => p.theme.Base1};`的方式使用主题变量
```javascript
// App.js
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import themes from 'src/styles/theme';
import normalizeCss from 'normalize.css';
import { THEME_TYPE } from 'src/data/consts';

const GlobalStyles = createGlobalStyle`
  ${normalizeCss};
  body{
    background-color: ${p => p.theme.Base0};
  }
`

export default function() {
  return (
    <ThemeProvider theme={themes[THEME_TYPE]}>
      <GlobalStyles />
    </ThemeProvider>
  )
}
```

### 4.3、style-componts的px2rem方案

```javascript
// src/utils/px2rem
import { css } from 'styled-components';

export function px2rem(pxValue, base = 20){
  if (Array.isArray(pxValue)) {
    pxValue = pxValue[0]
  }
  return parseInt(pxValue) / base + 'rem';
}
// 支持多行样式
export function mpx2rem(styles) {
  if (typeof styles !== 'string') {
    return styles;
  }
  return styles.replace(/\d+px/gm, matched => {
    return px2rem(matched);
  })
}
export default function r(string, ...extra) {
  let styles = css(string, ...extra);
  styles = styles.map(mpx2rem);

  return [[''], styles]
}
```

```javascript
// some components
import px2rem from 'src/utils/px2rem';

const ContentWrapper = styled.div(...px2rem`
  padding: 15px 0;
  font-size: 16px;
  color: ${p => p.theme.Text30};
  line-height: 26px;
  .stock{
    display: inline-block;
    font-size: 16px;
    color: #49B7FF;
    line-height: 26px;
  }
`)
```

## 5、另外还有以下方案可以参考代码

* 多组件loading及errStack错误重发方案(已封装hooks)
* 对axios的封装，包含统一的错误预处理


```javascript
```
```javascript
```

```javascript
```
```javascript
```

```javascript
```
```javascript
```

```javascript
```
```javascript
```

```javascript
```
```javascript
```