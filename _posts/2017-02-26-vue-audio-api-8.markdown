---
layout: post
title: 用 Vue + Audio API 实现的热门小游戏，八分音符
date: 2017-02-26 19:59:46 +0800
description: "预览地址： https://8.diamondfsd.com/ （谷歌浏览器打开最佳，不支持移动端，不支持IE）  会有麦克风权限申请，需要允许才可以正常玩耍，如果不小心点了禁止，可以在浏览器地址栏的右边，重新点击允许 Github: https://github.com/k55k32/quaver  游戏截图   由来  最近看这个游戏比较火，个人也是比较闲。 今天花了一下午的时间，来完成这个当前比较火的小游戏，八分音符。 看了这个游戏，原理也很简单，我们只需要获得声音，然后把声音转换为数字，最后控制小人移动就可以了。  声音的输入  我们发现这个游戏的原理很简单，就是通过声音来控制小人移动"
img:
tags: [在线 八分音符,浏览器录音,八分音符,WebRTC]
---

预览地址： [https://8.diamondfsd.com/](https://8.diamondfsd.com/)   （谷歌浏览器打开最佳，不支持移动端，不支持IE）
> 会有麦克风权限申请，需要允许才可以正常玩耍，如果不小心点了禁止，可以在浏览器地址栏的右边，重新点击允许

Github:  [https://github.com/k55k32/quaver](https://github.com/k55k32/quaver)

**游戏截图**
![alt]({{site.baseurl}}/assets/img/15be4483-b6be-4bdf-9617-7dedbce137c0b)



## 由来
最近看这个游戏比较火，个人也是比较闲。
今天花了一下午的时间，来完成这个当前比较火的小游戏，八分音符。
看了这个游戏，原理也很简单，我们只需要获得声音，然后把声音转换为数字，最后控制小人移动就可以了。

## 声音的输入
我们发现这个游戏的原理很简单，就是通过声音来控制小人移动，声音越大，跳得越高。
所以要做这个小游戏，我们就首先要解决的问题就是，如何从浏览器获得声音。这方面的东西，我以前也接触的不多。所以我只能先面向谷歌编程。
最后我搜索到了这篇文章： [WebRTC](http://javascript.ruanyifeng.com/htmlapi/webrtc.html) ， WebRTC主要让浏览器具备三个作用:
> 获取音频和视频
> 进行音频和视频通信
> 进行任意数据的通信
```js
navigator.getUserMedia({
    video: true,
    audio: true
}, onSuccess, onError);
```
通过navigator.getUserMedia方法，我们可以获得麦克风的音频流，看到这里，我们第一个问题已经解决了，解决了声音的输入。

## 声音的输出
获得了声音输入后，如何把输入的声音转换为我们编程可以使用的量化数字呢，我们需要更详细的文档  [WebAPI 接口 > AudioContext ](https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext)。通过参考这篇文档，结合一些实例，最终我写了一个 AudioAPI.js 用于将声音数据，量化为我们需要的声音大小数字。
```js
const navigator = window.navigator
navigator.getUserMedia = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia
const AudioContext = window.AudioContext ||
                      window.webkitAudioContext

const isSupport = !!(navigator.getUserMedia && AudioContext)
const context = isSupport && new AudioContext()
export default {
  isSupport,
  start () {
    // https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext  AudioContent API
    return new Promise((resolve, reject) => {
      navigator.getUserMedia({audio: true}, stream => { // 申请浏览器麦克风权限
        const source = context.createMediaStreamSource(stream)
        // 该对象可以获得声音的频率数据 https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext/createAnalyser
        const analyser = context.createAnalyser()
        source.connect(analyser)
        analyser.fftSize = 2048
        resolve(analyser)
      }, () => {
        reject()
      })
    })
  },
  getVoiceSize (analyser) {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    // 这里会获得一个数组，数字的下标表示频率，数组的值表示频率波大小
    // 通过对这些值的一个简单累加，就可以得到一个数字，用于游戏中表示声音的大小
    analyser.getByteFrequencyData(dataArray)

    const data = dataArray.slice(100, 1000)  // 只获得 100 - 1000Hz 的声音频率大小
    const sum = data.reduce((a, b) => a + b)  // 将这些值累加
    return sum
  }
}
```

通过 `AudioAPI.start()` 开启麦克风，返回一个 `Promise`，可以获取到 一个  `AnalyserNode`对象， 通过该对象的 `getByteFrequencyData` 方法，可以获取到实时的声音频率数据。


## 小人的 “移动”
因为之前没有写过游戏，不知道正常的写一个类跑酷的游戏需要怎么写。所以我就照着自己的想法来吧。首先，小人是不会动的，动的只是背景。底部的每一个黑块都是一个 DOM。
具体的代码可以看源码里面的 `Game.vue` 组件，因为全部代码比较长，这里就简单讲解一下。我们可以通过比较底部黑块和小人的位置 获得以下值:  **小人是否紧贴黑块上面？**

如果符合该条件，那么他就可以跳，而且不会再下降了。如果不在黑块上面，那么他就会一直下落:
1. 落到黑快上，就又符合 在黑块上 这个条件了，那么通过声音的收集，如果大于一定的量，小人就又跳起来了。 底下的黑块是一直向左移动的，看上去是小人在走的样子。
2. 落到空白处，会一直下降，如果碰不到黑块，那么降到最底部的时候，游戏结束

![alt]({{site.baseurl}}/assets/img/2f96d884-4f74-4cd1-a000-9f1ef6a378fc7)

## 项目源码
这三个问题解决了，这个游戏就完成了，当然，还有很多可以润色的地方。例如加上游戏背景音乐，在跳的时候加上音效，游戏结束的一些效果，声音收集的灵敏度，积分排行等。这些东西就留到下次再写吧，当然大家有兴趣也可以参与进来完成这方面的工作。

如果大家觉得还不错的话，就去 Github 上帮我点个 Star 吧。

Github:  [https://github.com/k55k32/quaver](https://github.com/k55k32/quaver)

预览地址： [https://8.diamondfsd.com/](https://8.diamondfsd.com/)   （谷歌浏览器打开最佳，不支持移动端，不支持IE）

个人博客: [https://diamondfsd.com](https://diamondfsd.com)
