---
layout: post
title: ICONO 纯 CSS 绘制的一套图标库
date: 2017-01-20 11:43:04 +0800
description: 说明  ICONO是一套使用CSS 绘制的图标库。 优点是不包含任何其他依赖，体积较小min+gzip后只有 7kb，包含137个图标，但是CSS图标的缺点也很明显，不能像字体图标一样那么简单就能修改图标大小。CSS绘制的图标，修改大小只能通过一些其他的方式，我是用 CSS3 的 transform:scale(0.5) 来进行图标的大小修改。  我使用ICONO作为我博客前端的图标库使用。 这里整理了一个 class 对应的图标表，方便自己使用这些图标。  ICONO 图标名称对应表   icono-icono  icono-home  icono-mail  icono-rss  icon
img:
tags: [图标库,icono,css]
---

## 说明
[ICONO](https://github.com/saeedalipoor/icono)是一套使用CSS 绘制的图标库。 优点是不包含任何其他依赖，体积较小`min+gzip`后只有 `7kb`，包含137个图标，但是CSS图标的缺点也很明显，不能像字体图标一样那么简单就能修改图标大小。CSS绘制的图标，修改大小只能通过一些其他的方式，我是用 `CSS3` 的 `transform:scale(0.5)` 来进行图标的大小修改。

我使用[ICONO](https://github.com/saeedalipoor/icono)作为我博客前端的图标库使用。
这里整理了一个 `class` 对应的图标表，方便自己使用这些图标。

## ICONO 图标名称对应表
<style>
.my-iconos-group{
display:flex;
flex-wrap: wrap;
}
.my-iconos-group > span{
display: block;
width: 33.33333%;
margin-bottom: 10px;
}
</style>
<div class="my-iconos-group">
<span><i class='icono-icono'></i> icono-icono</span>
<span><i class='icono-home'></i> icono-home</span>
<span><i class='icono-mail'></i> icono-mail</span>
<span><i class='icono-rss'></i> icono-rss</span>
<span><i class='icono-hamburger'></i> icono-hamburger</span>
<span><i class='icono-plus'></i> icono-plus</span>
<span><i class='icono-cross'></i> icono-cross</span>
<span><i class='icono-check'></i> icono-check</span>
<span><i class='icono-power'></i> icono-power</span>
<span><i class='icono-heart'></i> icono-heart</span>
<span><i class='icono-infinity'></i> icono-infinity</span>
<span><i class='icono-flag'></i> icono-flag</span>
<span><i class='icono-file'></i> icono-file</span>
<span><i class='icono-image'></i> icono-image</span>
<span><i class='icono-video'></i> icono-video</span>
<span><i class='icono-music'></i> icono-music</span>
<span><i class='icono-headphone'></i> icono-headphone</span>
<span><i class='icono-document'></i> icono-document</span>
<span><i class='icono-folder'></i> icono-folder</span>
<span><i class='icono-pin'></i> icono-pin</span>
<span><i class='icono-smile'></i> icono-smile</span>
<span><i class='icono-eye'></i> icono-eye</span>
<span><i class='icono-sliders'></i> icono-sliders</span>
<span><i class='icono-share'></i> icono-share</span>
<span><i class='icono-sync'></i> icono-sync</span>
<span><i class='icono-reset'></i> icono-reset</span>
<span><i class='icono-gear'></i> icono-gear</span>
<span><i class='icono-signIn'></i> icono-signIn</span>
<span><i class='icono-signOut'></i> icono-signOut</span>
<span><i class='icono-support'></i> icono-support</span>
<span><i class='icono-dropper'></i> icono-dropper</span>
<span><i class='icono-tiles'></i> icono-tiles</span>
<span><i class='icono-list'></i> icono-list</span>
<span><i class='icono-chain'></i> icono-chain</span>
<span><i class='icono-rename'></i> icono-rename</span>
<span><i class='icono-search'></i> icono-search</span>
<span><i class='icono-book'></i> icono-book</span>
<span><i class='icono-forbidden'></i> icono-forbidden</span>
<span><i class='icono-trash'></i> icono-trash</span>
<span><i class='icono-keyboard'></i> icono-keyboard</span>
<span><i class='icono-mouse'></i> icono-mouse</span>
<span><i class='icono-user'></i> icono-user</span>
<span><i class='icono-crop'></i> icono-crop</span>
<span><i class='icono-display'></i> icono-display</span>
<span><i class='icono-imac'></i> icono-imac</span>
<span><i class='icono-iphone'></i> icono-iphone</span>
<span><i class='icono-macbook'></i> icono-macbook</span>
<span><i class='icono-imacBold'></i> icono-imacBold</span>
<span><i class='icono-iphoneBold'></i> icono-iphoneBold</span>
<span><i class='icono-macbookBold'></i> icono-macbookBold</span>
<span><i class='icono-nexus'></i> icono-nexus</span>
<span><i class='icono-microphone'></i> icono-microphone</span>
<span><i class='icono-asterisk'></i> icono-asterisk</span>
<span><i class='icono-terminal'></i> icono-terminal</span>
<span><i class='icono-paperClip'></i> icono-paperClip</span>
<span><i class='icono-market'></i> icono-market</span>
<span><i class='icono-clock'></i> icono-clock</span>
<span><i class='icono-textAlignRight'></i> icono-textAlignRight</span>
<span><i class='icono-textAlignCenter'></i> icono-textAlignCenter</span>
<span><i class='icono-textAlignLeft'></i> icono-textAlignLeft</span>
<span><i class='icono-indent'></i> icono-indent</span>
<span><i class='icono-outdent'></i> icono-outdent</span>
<span><i class='icono-frown'></i> icono-frown</span>
<span><i class='icono-meh'></i> icono-meh</span>
<span><i class='icono-locationArrow'></i> icono-locationArrow</span>
<span><i class='icono-plusCircle'></i> icono-plusCircle</span>
<span><i class='icono-checkCircle'></i> icono-checkCircle</span>
<span><i class='icono-crossCircle'></i> icono-crossCircle</span>
<span><i class='icono-exclamation'></i> icono-exclamation</span>
<span><i class='icono-exclamationCircle'></i> icono-exclamationCircle</span>
<span><i class='icono-comment'></i> icono-comment</span>
<span><i class='icono-commentEmpty'></i> icono-commentEmpty</span>
<span><i class='icono-areaChart'></i> icono-areaChart</span>
<span><i class='icono-pieChart'></i> icono-pieChart</span>
<span><i class='icono-barChart'></i> icono-barChart</span>
<span><i class='icono-bookmark'></i> icono-bookmark</span>
<span><i class='icono-bookmarkEmpty'></i> icono-bookmarkEmpty</span>
<span><i class='icono-filter'></i> icono-filter</span>
<span><i class='icono-volume'></i> icono-volume</span>
<span><i class='icono-volumeLow'></i> icono-volumeLow</span>
<span><i class='icono-volumeMedium'></i> icono-volumeMedium</span>
<span><i class='icono-volumeHigh'></i> icono-volumeHigh</span>
<span><i class='icono-volumeDecrease'></i> icono-volumeDecrease</span>
<span><i class='icono-volumeIncrease'></i> icono-volumeIncrease</span>
<span><i class='icono-volumeMute'></i> icono-volumeMute</span>
<span><i class='icono-tag'></i> icono-tag</span>
<span><i class='icono-calendar'></i> icono-calendar</span>
<span><i class='icono-camera'></i> icono-camera</span>
<span><i class='icono-piano'></i> icono-piano</span>
<span><i class='icono-ruler'></i> icono-ruler</span>
<span><i class='icono-cup'></i> icono-cup</span>
<span><i class='icono-creditCard'></i> icono-creditCard</span>
<span><i class='icono-facebook'></i> icono-facebook</span>
<span><i class='icono-twitter'></i> icono-twitter</span>
<span><i class='icono-gplus'></i> icono-gplus</span>
<span><i class='icono-youtube'></i> icono-youtube</span>
<span><i class='icono-linkedIn'></i> icono-linkedIn</span>
<span><i class='icono-instagram'></i> icono-instagram</span>
<span><i class='icono-flickr'></i> icono-flickr</span>
<span><i class='icono-delicious'></i> icono-delicious</span>
<span><i class='icono-codepen'></i> icono-codepen</span>
<span><i class='icono-blogger'></i> icono-blogger</span>
<span><i class='icono-disqus'></i> icono-disqus</span>
<span><i class='icono-dribbble'></i> icono-dribbble</span>
<span><i class='icono-play'></i> icono-play</span>
<span><i class='icono-pause'></i> icono-pause</span>
<span><i class='icono-stop'></i> icono-stop</span>
<span><i class='icono-rewind'></i> icono-rewind</span>
<span><i class='icono-forward'></i> icono-forward</span>
<span><i class='icono-next'></i> icono-next</span>
<span><i class='icono-previous'></i> icono-previous</span>
<span><i class='icono-caretRight'></i> icono-caretRight</span>
<span><i class='icono-caretLeft'></i> icono-caretLeft</span>
<span><i class='icono-caretUp'></i> icono-caretUp</span>
<span><i class='icono-caretDown'></i> icono-caretDown</span>
<span><i class='icono-rightArrow'></i> icono-rightArrow</span>
<span><i class='icono-leftArrow'></i> icono-leftArrow</span>
<span><i class='icono-upArrow'></i> icono-upArrow</span>
<span><i class='icono-downArrow'></i> icono-downArrow</span>
<span><i class='icono-sun'></i> icono-sun</span>
<span><i class='icono-moon'></i> icono-moon</span>
<span><i class='icono-caretRightCircle'></i> icono-caretRightCircle</span>
<span><i class='icono-caretLeftCircle'></i> icono-caretLeftCircle</span>
<span><i class='icono-caretUpCircle'></i> icono-caretUpCircle</span>
<span><i class='icono-caretDownCircle'></i> icono-caretDownCircle</span>
<span><i class='icono-caretRightSquare'></i> icono-caretRightSquare</span>
<span><i class='icono-caretLeftSquare'></i> icono-caretLeftSquare</span>
<span><i class='icono-caretUpSquare'></i> icono-caretUpSquare</span>
<span><i class='icono-caretDownSquare'></i> icono-caretDownSquare</span>
<span><i class='icono-cart'></i> icono-cart</span>
<span><i class='icono-sitemap'></i> icono-sitemap</span>
<span><i class='icono-keyboard'></i> icono-keyboard</span>
<span><i class='icono-plus'></i> icono-plus</span>
<span><i class='icono-mouse'></i> icono-mouse</span>
<span><i class='icono-plus'></i> icono-plus</span>
<span><i class='icono-display'></i> icono-display</span>
<span><i class='icono-cross'></i> icono-cross</span>
</div>
<link href="//cdn.bootcss.com/icono/1.3.0/icono.min.css" rel="stylesheet">