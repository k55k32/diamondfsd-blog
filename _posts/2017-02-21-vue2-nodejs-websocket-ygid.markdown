---
layout: post
title: Vue2 + Nodejs  + WebSocket 完成你画我猜多人在线游戏
date: 2017-02-21 20:42:20 +0800
description: "使用 websocket + vue2 即可完成一个很有意思的在线游戏作品。 你画我猜，相信大家对这个游戏都很熟悉。 我用Vue2 + mint-ui + nodejs + websocket 实现了你画我猜这个游戏。 建议移动端打开效果更佳(可扫下方二维码)，PC端需要使用谷歌开发者模式，然后使用移动调试工具，才可以正常使用（主要是一些touch事件，pc不支持）。  大家可以拉上一两个人，来开个房间试试看，体验体验效果。 http://yd.diamondfsd.com   主要实现了以下这些功能  大厅功能  个人信息显示 顶部显示个人昵称，可以修改 暂时不支持上传头像，头像用昵称第一个"
img:
tags: [你画我猜手机游戏]
---

使用 websocket + vue2 即可完成一个很有意思的在线游戏作品。
你画我猜，相信大家对这个游戏都很熟悉。
我用Vue2 + mint-ui + nodejs + websocket 实现了你画我猜这个游戏。
建议移动端打开效果更佳(可扫下方二维码)，PC端需要使用谷歌开发者模式，然后使用移动调试工具，才可以正常使用（主要是一些touch事件，pc不支持）。

大家可以拉上一两个人，来开个房间试试看，体验体验效果。
[http://yd.diamondfsd.com](http://yd.diamondfsd.com)
![alt]({{site.baseurl}}/assets/img/ddeea735-598e-4e1e-b262-2d133f813303-)

主要实现了以下这些功能

## 大厅功能
**个人信息显示**
顶部显示个人昵称，可以修改
暂时不支持上传头像，头像用昵称第一个字母代替
暂时使用 `localStorage` 储存基本基本个人信息（昵称,token等）
实施更新房间列表，在线人数等信息
![alt]({{site.baseurl}}/assets/img/292c2c29-44b1-45fd-b9dc-7a2f69953c78n)

**创建游戏房间**
房间名称:
房间类型：公开（可以在游戏大厅被看到），私有（可以通过游戏大厅左上角查找房间号进入）

**加入房间**
公开房间加入： 直接在首页游戏大厅的房间列表里面点击加入即可
私密房间加入： 扫秒二维码或者输入房间号 （二维码由客户端使用js生成，暂未实现）
房间人满后不可加入
房间游戏开始后不可加入
后期可加入观战功能
当游戏人数大于等于2或者以上的时候，可以开始游戏。
房间内可以聊天，默认第一个进入房间的人是房主，房主可以开始游戏。
![alt]({{site.baseurl}}/assets/img/042c9bd1-1c7b-49c1-8b46-d3e987869d178)

## 游戏主功能
使用 `canvas` 做画布，通过`websocket`实时发送动作，全图数据来实现动态笔迹，和最终图片一致性。
可以修改画笔颜色，粗细，进行撤销，恢复，清空等操作。
![alt]({{site.baseurl}}/assets/img/a425d560-e7de-4c20-ab1c-9e1f9b868690d)
![alt]({{site.baseurl}}/assets/img/5c373f24-32da-4766-b96b-ac0f8a184b37B)
每轮游戏结束后公布答案，预置了一些快捷短语可以恢复。 游戏过程中 作画者 不可以发文字聊天，其他玩家通过发文字猜答案。
第一个猜对的 3 分， 第二个猜对的 2 分。 剩下猜对的1分。 第一个猜完后，游戏时间缩短为 30 秒。每个人猜对后，作画者+1分

![alt]({{site.baseurl}}/assets/img/39b12c5f-d08a-41f9-a80d-9f32b0b22c6eP)

## 项目结构
这个游戏由两个项目组成，一个是前端，一个是服务端
前端 [github-you-draw-i-guess](https://github.com/k55k32/you-draw-i-guess)
前端项目由  Vue2 + mint-ui + vuex + vue-router 完成的单页面app。  使用 `websocket` 和服务端进行通讯，所有的接口都由 `websocket` 完成

WebSocket 服务端  [github-ydig-websocket](https://github.com/k55k32/ydig-websocket)
服务端主要就是用了 `ws` 这个库，和 `babel` 来支持一些 es6 的语法来完成的。
服务端承载了所有的游戏相关逻辑和一些数据。 但是因为没有经过足够的测试，肯定还是有不少bug的。

另外，没有做数据储存，所有的数据都储存在当次运行的服务内存里，所以服务重启后，所有的数据就清空了，哈哈，主要是我懒，就没做数据储存了。

这个也就简单介绍一下这个项目，以及开放出源代码供大家参考研究。那个服务器承载量不大，卡卡的也不要见怪。另外有什么bug 大家可以在 github 上提 issue。 还有就是，欢迎大家贡献代码，虽然真个项目也是我乱写的，还是希望有人能看得懂呀。  :)


## 项目源码
前端: [github-you-draw-i-guess](https://github.com/k55k32/you-draw-i-guess)
WebSocket 服务端:  [github-ydig-websocket](https://github.com/k55k32/ydig-websocket)
在线演示地址: [http://yd.diamondfsd.com](http://yd.diamondfsd.com)
在线演示二维码: ![alt]({{site.baseurl}}/assets/img/ddeea735-598e-4e1e-b262-2d133f813303-)

个人博客: [https://diamondfsd.com](https://diamondfsd.com)


## 总结
从整个项目来说，前端，后端，UI，业务逻辑，都是我苦思冥想做出来的。刚开始是想做微信版的，使用微信登录来储存用户数据，可是后来发现必须要企业服务号才能申请到相关接口。然后项目就停了一段时间。
这段时间比较空闲了，就想了一个简单的办法，既然是一个开放式的游戏，就根本不需要登录呀。所以变成了人人进入就可以玩的一个项目。 可以从微信打开，qq打开，微博打开，只要支持h5的浏览器都可以打开。
欢迎大家对项目的各方面做出的评价。 能改的地方尽量会改，也希望大家贡献自己的代码。