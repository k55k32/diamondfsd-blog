---
layout: post
title: 前端性能优化之 —— 图片延迟加载 (原理以及实现方式)
date: 2017-02-01 18:56:40 +0800
description: "前端开发的时候，有些列表页面可能会有很多图片需要加载。一次加载太多图片，会占用很大的带宽，影响网页的加载速度。  这时候我们想到一种方式，让用户浏览到什么地方，就加载该处的图片。  这里写了一个简单的例子，大家可以去体验一下，当然这里考虑到的是最简单的情况。 这里简单的讲解一下这个例子里面的源码。  例子查看  DOM 结构  由一个父容器div#lazy-img，里面是图片标签，父容器是可以滚动的，图片有固定高度。大家可以看到，容器内的img元素没有 src 属性，而有一个 data-src 属性。 这是不想让图片提前加载，所以把图片的链接储存到data-src 内。  div#lazy-i"
img:
tags: [javascript,图片延迟加载,前端开发]
---

前端开发的时候，有些列表页面可能会有很多图片需要加载。一次加载太多图片，会占用很大的带宽，影响网页的加载速度。

这时候我们想到一种方式，让用户浏览到什么地方，就加载该处的图片。

这里写了一个简单的例子，大家可以去体验一下，当然这里考虑到的是最简单的情况。 这里简单的讲解一下这个例子里面的源码。

[例子查看](http://codepen.io/diamondfsd/pen/qRxwRM)

## DOM 结构
由一个父容器`div#lazy-img`，里面是图片标签，父容器是可以滚动的，图片有固定高度。大家可以看到，容器内的img元素没有 `src` 属性，而有一个 `data-src` 属性。 这是不想让图片提前加载，所以把图片的链接储存到`data-src` 内。

```pug
div#lazy-img
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
  img(data-src="{{site.baseurl}}/assets/img/9c61bc16-ae02-4f06-a8aa-0501db51eadb.png")
```

```css
img{
  width:600px;
  height:300px;
  border: 2px solid #eee;
  background: #ccc;
}
#lazy-img{
  height: 400px;
  background:#eee;
  overflow: auto;
}
```



## Javascript 代码
我们获取容器内所有有 `data-src` 属性的dom对象，遍历获取他们的相对高度，储存成 `{ height: imgDom}` 格式。然后监听 容器的滚动事件，当滚动的时候，计算当前滚动区域显示的图片dom，并将改 图片dom 的 `src` 的内容改成我们存储在 `data-src` 的内容。

```js
var imgContainer = document.getElementById('lazy-img')
var imgs = imgContainer.querySelectorAll('[data-src]')
var imgHeightDomMapping = {}
imgs.forEach(function (img) {
  imgHeightDomMapping[img.offsetTop + img.clientHeight / 1.5] = img
})  // 获取所有 dom 对象相对容器的高度 并储存成 key: height, value: imgDom

imgContainer.addEventListener('scroll', function () {
  showImage()
})

function showImage () {
  var currentHeight = imgContainer.clientHeight + imgContainer.scrollTop // 滚动区域的高度
  Object.keys(imgHeightDomMapping).forEach(function (imageHeight) {
    if (currentHeight > imageHeight) { // 判断当前图片是否已经显示
        //将图片dom的 `src` 改为 `data-src` 的内容
        imgHeightDomMapping[imageHeight].src = imgHeightDomMapping[imageHeight].getAttribute('data-src')
    }
  })
}

showImage() // 主动调用一次 加载首页的
```

这里简单的实现了一个延迟加载，主要是告诉大家原理，可扩展的地方还很多。 例如提前加载 N 张图片，可以包装成一个通用的插件等等。只要大家了解到了原理，那么实现折些都很简单。 这篇文章也算是抛砖引玉，欢迎大家进行讨论。