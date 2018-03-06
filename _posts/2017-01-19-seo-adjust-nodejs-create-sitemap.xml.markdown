---
layout: post
title: SEO优化 - 使用nodejs动态生成网站sitemap.xml 优化抓取
date: 2017-01-19 14:33:31 +0800
description: 主要讲一下如何用Nodejs + express + sitemap.js 来动态生成 sitemap.xml。 自己的博客前端动态生成 sitemap.xml 来让搜索引擎（google_site:diamondfsd.com）抓取，生成了 sitemap.xml 过后，果然自己博客的收录速度快了很多。 下面就简单的介绍一下 sitemap.xml 的作用以及 一个简单的例子。  sitemap 介绍  sitemap，翻译过来就是站点地图。是告诉搜索引擎这个网站上有那些页面可以抓取。 sitemap最简单的格式 txt 格式， 只需要每行列出一个链接就可以: sitemap.txt  ht
img: 9773977c-0db1-464a-ae32-c7bf92da12f5.png
tags: [seo,express生成sitemap.xml,nodejs生成sitemap.xml,sitemap.js教程,seo优化]
---

主要讲一下如何用Nodejs + express + sitemap.js 来动态生成 `sitemap.xml`。
自己的博客前端动态生成 `sitemap.xml` 来让搜索引擎（[google_site:diamondfsd.com](https://www.google.com.hk/webhp?hl=zh-CN&sourceid=cnhp&gws_rd=ssl#safe=strict&hl=zh-CN&q=site:diamondfsd.com)）抓取，生成了 `sitemap.xml` 过后，果然自己博客的收录速度快了很多。
下面就简单的介绍一下 `sitemap.xml` 的作用以及 一个简单的例子。

##  [sitemap](https://www.sitemaps.org/protocol.html) 介绍
sitemap，翻译过来就是站点地图。是告诉搜索引擎这个网站上有那些页面可以抓取。
sitemap最简单的格式 `txt` 格式， 只需要每行列出一个链接就可以: `sitemap.txt`
```string
https://diamondfsd.com/xxx/xxx
https://diamondfsd.com/xxx/xxx
.......
```

另外一种比较丰富的格式就是xml格式，xml格式由 `<urlset></urlset>` 作为根元素，内嵌多个`<url></url> 子元素`
[https://diamondfsd.com/sitemap.xml](https://diamondfsd.com/sitemap.xml)
```xml
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
xmlns:xhtml="http://www.w3.org/1999/xhtml"
xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>
      http://diamondfsd.com/article/0514fe5c-3925-4175-9486-940c0ee9c054
    </loc>
    <lastmod>2017-01-14</lastmod>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>
      http://diamondfsd.com/article/35caae5b-78f5-4728-9170-92144570c7a3
    </loc>
    <lastmod>2017-01-22</lastmod>
    <changefreq>daily</changefreq>
  </url>
</urlset>
```

## [Sitemap] XML格式标签定义
标签 | 参数 | 描述
----| ------- | ----
`<urlset>`| 必须 | 属性内写了当前使用的协议标准
`<url>` | 必须 | 每个url条目的父标签，内包含了url的一些其他信息描述
`<loc>`| 必须| 网页的网址（网址以协议开头 `http://|https://`）
`<lastmod>` | 可选 | 网页的最后一次修改时间，使用[W3C的时间标准](https://www.w3.org/TR/NOTE-datetime)，例如 `YYYY-MM-DD`
`<changefreq> `| 可选| 网页的更新频率，可以供搜索引擎参考抓取频率 `always, hourly, daily, weekly, monthly, yearly, never`（搜索引擎的会有自己的抓取策略，所以这个值仅供搜索引擎参考）
`<priority>` | 可选| 优先级取值范围 0.1 至 1。 ----- 也是一个供搜索引擎参考的值

## 如何动态生成sitemap.xml 文件
毫无疑问，sitemap.xml 拥有更丰富的语义，可以更好的让搜索引擎抓取。本博客使用的[sitemap.js](https://github.com/ekalinin/sitemap.js) 来生成 `sitemap.xml` 文件。

```js
import express from 'express'
import sm from 'sitemap'
import service from  './service/ArticleService'

const app = express()
const host = 'https://diamondfsd.com'

/* service.allNames 获取一个文章list 结构如下
*  {
      title: String,
      id: String,
      updateTime: Long
    }
*/

app.get('/sitemap.xml', (req, res) => {
  service.allNames().then(data => {
    let smOption = {
      hostname: host,
      cacheTime: 600000,
      urls: [host]
    }
    data.forEach(art => {
      smOption.urls.push({
        url: `/article/${art.id}`,
        changefreq: 'daily',
        lastmod: new Date(art.updateTime)
      })
    })
    let xml = sm.createSitemap(smOption).toString()
    res.header('Content-Type', 'application/xml')
    res.send(xml)
  }).catch(e => {
    res.send(e)
  })
})
```
具体的文档，可以去 [ekalinin/sitemap.js](https://github.com/ekalinin/sitemap.js) 去看，这里只说一下本博客中的实际使用。
我将所有的文章的id以及更新时间获取到，然后生成  url 对象
```
{
  url: `/article/${article.id}`,
  changefreq: 'daily',
  lastmod: new Date(art.updateTime)
}
```
然后构成 创建sitemap.xml 所需要的 对象
 ```
{
      hostname: host,
      cacheTime: 600000,
      urls: [url, url, url, url...]
}
```
最后用 `sitemap` 的 `createSitemap(opt).toString()` 方法获得 `xml` 字符串 然后发送到客户端。

每次搜索引擎请求[https://diamondfsd.com/sitemap.xml](https://diamondfsd.com/sitemap.xml)的时候，就会获取最新的文章列表，然后生成最新的sitemap.xml。 这样能够让搜索引擎更快，跟全面的获取到网站想要被抓取的网页地图。