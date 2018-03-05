---
layout: post
title: 我的第一个Vue组件 Markdown-It-Editor，支持Markdown格式的富文本编辑器
date: 2017-01-06 10:03:29
description: 由来  编辑器由Vue2 来开发完成， 作为 Vue Component （Vue 组件）来使用。 有兴趣可以在GitHub上看一下源码，和在线体验一下，具体的用法和说明文档也是在github上面 --> Fork on Github | Try the Demo。 写这个编辑器的原因主要是因为自己想写一个博客，作为技术人员的博客，当然编辑器也要有geeker范。markdown就是一种很合适我的一中语法，格式统一，没有普通富文本那么花哨。功能丰富，对主要的一些文本操作都支持。能够像写代码一样写文章，这种体验 爽到爆，当然这种体验是基于markdown的:)。  工具栏    输入框  基本的
img: bc38d789-5046-4c2a-81ce-af472a4d45b2.png
tags: [vue组件,富文本编辑器,vue]
---

# 由来
编辑器由Vue2 来开发完成， 作为 `Vue Component` （Vue 组件）来使用。 有兴趣可以在GitHub上看一下源码，和在线体验一下，具体的用法和说明文档也是在github上面 --> [Fork on Github](https://github.com/k55k32/markdown-it-editor) | [Try the Demo](http://md.diamondfsd.com/)。
写这个编辑器的原因主要是因为自己想写一个博客，作为技术人员的博客，当然编辑器也要有geeker范。`markdown`就是一种很合适我的一中语法，格式统一，没有普通富文本那么花哨。功能丰富，对主要的一些文本操作都支持。能够像写代码一样写文章，这种体验 `爽到爆`，当然这种体验是基于`markdown`的:)。

## 工具栏
![alt]({{site.baseurl}}/assets/img/0750a965-78e1-4ccb-8f2c-18c34af80def.gif)

## 输入框
基本的文字输入之外，还可以使用快捷键进行一些操作，这是快捷键列表
`Ctrl+B` **加粗**
`Ctrl+I` *加斜*
`Ctrl+U` <u>下划线</u>
`Ctrl+D` ~~删除线~~
`Ctrl+L` [链接](http://diamondfsd.com)
Ctrl + \` `Code`
`Ctrl+Z` 撤销
`Ctrl+Y` 恢复
> 这些快捷键对应的都是工具栏上面的按钮，鼠标移动上去后，会提示快捷键。输入框对图片粘贴做了一些处理，会根据当前的图片上传配置，将图片直接上传，很方便就能够截图上传。另外对经常使用到的 `Tab` 键也做了一些处理，不会跳出当前输入框，而且可以选择多行文本进行 `Tab` | `Shift+Tab` 的操作

## 预览框
使用 [markdown-it](https://github.com/markdown-it/markdown-it) 将输入框的内容转换为富文本格式。样式使用的是`GitHub Readme`的风格（个人觉得GitHub Readme的格式挺好看的）。预览框可以收起，也可以拖动预览框左边缘进行大小的调整。工具栏有全屏按钮，可以全屏进行编辑和预览的。
![alt]({{site.baseurl}}/assets/img/dafd6c9b-e458-4fd6-b8a5-8d05d37edf28.gif)


### 收获了什么
写这个编辑器也收获了很多，熟练了markdown的语法。对打包发布有了个更好的理解。知道了如何将自己写的软件发布出去，让别人可以通过npm install markdown-it-editor 来依赖自己的编辑器。 还了解了如何去写一个独立的Vue 组件。 当然，最大是收货就是，在自己的博客里面用自己写的编辑器，还是很有成就感的。

