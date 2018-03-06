---
layout: post
title: 使用webpack+vue+less开发，使用less-loader，配置全局less变量
date: 2017-06-17 09:35:02 +0800
description: "Less 是一门 CSS 预处理语言,它扩展了 CSS 语言,增加了变量、Mixin、函数等特性，在阅读这篇文章的时候，笔者假设你已经有了一定的less编码经验。以下将不会讲解less的用法。  我们在构建一个页面的时候，会定义一些基本参数，例如主色调，文字颜色，标题颜色，副标题颜色，字体大小等等。 通过统一的参数，可以保证页面整体风格的一致性。  在使用Vue模板进行开发的时候，我们把每个页面组件化，组件内的样式就写在组件自身的<style>标签内。 这时候我们需要引用一个变量，通常的方式是专门定义一个公共的variables.less 然后在每个需要使用这些变量的组件内，使用 @impor"
img:
tags: [vue]
---

Less 是一门 CSS 预处理语言,它扩展了 CSS 语言,增加了变量、Mixin、函数等特性，在阅读这篇文章的时候，笔者假设你已经有了一定的less编码经验。以下将不会讲解less的用法。

我们在构建一个页面的时候，会定义一些基本参数，例如主色调，文字颜色，标题颜色，副标题颜色，字体大小等等。 通过统一的参数，可以保证页面整体风格的一致性。

在使用Vue模板进行开发的时候，我们把每个页面组件化，组件内的样式就写在组件自身的`<style>`标签内。 这时候我们需要引用一个变量，通常的方式是专门定义一个公共的`variables.less` 然后在每个需要使用这些变量的组件内，使用 `@import 'xxxpath/variables.less';`，主动引用的方式，来引入这些变量。

当组件少的时候还好说，当组件过多的时候，每次都引入就比较烦了。 最近在使用[Vux-components](https://vux.li/#/)这个组件库的时候，该作者提供了一个 [vux-loader](https://github.com/airyland/vux-loader) 来配合组件库的时候，可以按需打包使用的组件，以及支持全局less变量。

支持全局less变量，这个功能让我在工作中减少了很多重复的劳动力。 最近在构建一个pc端项目的时候，我就想自己研究一下如何使用全局的less变量。

## [less-loader](https://github.com/webpack-contrib/less-loader)

首先看看less-loader支不支持这样的功能，看了一遍文档后，发现并不支持。可是在看文档的过程中，有以下一段描述：
> You can pass any Less specific options to the less-loader via loader options.
大意是，“你可以将less特有的配置通过 loader 的 options 参数传入 less-loader”

随后我就去翻查了 less 文档中的选项部分 [Less - command-line-usage-options](http://lesscss.org/usage/#command-line-usage-options) ， 发现有以下选项符合我们的需求

> ### Global Variable
> ```bash
> lessc --global-var="my-background=red"
> ```
> This option defines a variable that can be referenced by the file. Effectively the declaration is put at the top of your base Less file, meaning it can be used but it also can be overridden if this variable is defined in the file.
> ### Modify Variable
>```bash
>lessc --modify-var="my-background=red"
>```
>As opposed to the global variable option, this puts the declaration at the end of your base file, meaning it will override anything defined in your Less file.

`global-var` 会将所传入的参数写入所有的less文件的顶部，我们可以在自己的less文件中重写这些参数的值
`modify-var` 和global-var 相反，会将所传入的参数写入所有less文件的底部，我们自己定义的变量会被覆盖

了解到了这些，我就在项目里做了一下简单的测试，less-loader 的文档中说，less 原生的选项都需要转换成驼峰式，然后传入 loader的options中。
```
loader: "less-loader",
options: {
    globalVars: {
       'primary-color': 'blue'
    }
}
```
通过这样的配置，我发现，果然，我在全局都可以不需要导入变量文件，直接使用 `@primary-color` 这个参数在我的less文件中。
> 原生的选项和less-loader支持的选项，大部分只需要简单的转换为驼峰式即可，小部分略有不同，例如例子中写的 `global-val` 在loader的选项中是 `globalVars` 多了一个 's'，所有的支持并且对应的选项名，可以在参考 [lessc](https://github.com/less/less.js/blob/3.x/bin/lessc#L361)
源码。

## 配置全局参数
知道了如何传入全局变量，那么接下来就是解决如何方便的传入全局变量了。这里参考了 vux-loader 的实现，我将所有需要使用到的全局变量，存入一个 theme.less 中，大致内容如下。
```less
@primary-color: #20A0FF;
@waring-color: #F7BA2A;
@success-color: #13CE66;
@danger-color: #FF4949;
@gray-color: #D3DCE6;
@mark-color: #E5E9F2;
@first-color: #1F2D3D;
@sencond-color: #324057;
@thrid-color: #475669;
@font-size: 14px;
@font-color: @first-color;
@global-padding: 15px;
```

然后，解析这个文件，将这些参数转换为 {key:value}的格式，最后传入 less-loader中就可以了。
因为偷懒，所以直接将 vux-loader 中的 get-less-variables.js 拷过来使用了。
```
const fs = require('fs');
module.exports = function getLessVariables(file) {
    var themeContent = fs.readFileSync(file, 'utf-8')
    var variables = {}
    themeContent.split('\n').forEach(function(item) {
        if (item.indexOf('//') > -1 || item.indexOf('/*') > -1) {
            return
        }
        var _pair = item.split(':')
        if (_pair.length < 2) return;
        var key = _pair[0].replace('\r', '').replace('@', '')
        if (!key) return;
        var value = _pair[1].replace(';', '').replace('\r', '').replace(/^\s+|\s+$/g, '')
        variables[key] = value
    })
    return variables
}
```

因为项目是用 vue-cli 搭建的，预处理器的样式都在 `build/utils.js`中， 将读取出来的文件，传入这个方法，就可以在所有的组件中使用全局定义的那些变量了。
```
less: generateLoaders('less', {
  globalVars: getLessVariables(config.themePath)
}),
```

到这里，大部分功能以及完成了，但是有点不足的就是，如果要修改存放全局变量的less文件，必须重新启动项目才能实现效果了，不能实现热更行。 但是vux-loader实现了修改全局变量less后，可以自动重新编译的功能。

这点等我有空再来研究如何实现的。

希望这篇文章对大家有帮助。

