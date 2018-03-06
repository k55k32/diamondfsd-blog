---
layout: post
title: 使用 GitHub OAuth 第三方验证登录
date: 2017-04-27 18:31:42 +0800
description: "现在很多站点都支持第三方登录功能。 作为一个技术博客，目标受众项是一批程序员，第三方登录的就选中了github。 这篇文章注意是讲一讲如何给自己的博客添加github自动登录功能。  OAuth 2.0  说到第三方登录，不得不提的一个知识点就是 oauth 2.0。  OAuth（开放授权）是一个开放标准，允许用户让第三方应用访问该用户在某一网站上存储的私密的资源（如照片，视频，联系人列表），而无需将用户名和密码提供给第三方应用。 ---- 百度百科 这个协议在认证和授权的时候涉及到：  服务提供方，例如 GitHub，GitHub上储存了用户的登录名，Email，昵称，头像等信息 用户 客"
img: 481317de-cb79-4bb1-8f87-e27e4a09cbaf.jpg
tags: [github,oauth2,第三方登录]
---

现在很多站点都支持第三方登录功能。
作为一个技术博客，目标受众项是一批程序员，第三方登录的就选中了github。
这篇文章注意是讲一讲如何给自己的博客添加github自动登录功能。

## OAuth 2.0
说到第三方登录，不得不提的一个知识点就是 oauth 2.0。
> OAuth（开放授权）是一个开放标准，允许用户让第三方应用访问该用户在某一网站上存储的私密的资源（如照片，视频，联系人列表），而无需将用户名和密码提供给第三方应用。   ---- 百度百科

这个协议在认证和授权的时候涉及到：
1. 服务提供方，例如 GitHub，GitHub上储存了用户的登录名，Email，昵称，头像等信息
2. 用户
3. 客户端，例如我的博客就是一个客户端，需要服务方向我提供用户的一些基本信息

OAuth 协议的认证和授权的过程如下：
1. 用户打开我的博客后，我想要通过GitHub获取改用户的基本信息
2. 在转跳到GitHub的授权页面后，用户同意我获取他的基本信息
3. 博客获得GitHub提供的授权码，使用该授权码向GitHub申请一个令牌
4. GitHub对博客提供的授权码进行验证，验证无误后，发放一个令牌给博客端
5. 博客端使用令牌，向GitHub获取用户信息
6. GitHub 确认令牌无误，返回给我基本的用户信息

## 如何使用GitHub提供的 OAuth 服务
1. 打开 Setting > Developer setting > OAuth applications
2. 点击 Register a new application
3. 填入基本的app信息
4. 创建成功，会有如下页面

![alt]({{site.baseurl}}/assets/img/256e7ad0-6206-45bb-bdf6-c7d58857f3edm)

这里的各项配置具体的作用，我们还是看一看GitHub提供的文档 [OAuth GitHub Developer Guide](https://developer.github.com/v3/oauth/)

## 具体流程
1. 转跳到 GitHub 用户授权页面， `client_id` 必须传
其他参数如果有需要就传，例如我这里需要获取用户的邮箱信息，就加了一个 `scope=user:email`
最终拼成的URL如下:
`https://github.com/login/oauth/authorize?client_id=myclient_id&scope=user:email`

2. 当用户同意授权后，链接地址就会转跳到 我们配置页面内的 `Authorization callback URL` 所填写的URL地址，并且会带上一个 `code`参数，这个参数在后面获取用户token是必须的一个参数。
获取到这个code参数后，我会将这个code传到服务器的后台，然后后台调用 `https://github.com/login/oauth/access_token` 这个api，传入  `client_id`  `client_secret` `code` 这三个参数，可以获取到一个 access_token。

3. 获取到 access_token 后， 再调用 `https://api.github.com/user?access_token=access_token` 这个API，就可以获取到基本的用户信息了。
用户的基本信息内容如下所示， 根据第一步传入的不同的 scope，获取到的用户信息也是不同的。博客后台使用 login 字段作为用户的唯一标示，因为email 可能为空，之前用email发生了一些bug。
```json
{
    "login": "Diamondtest",
    "id": 28478049,
    "avatar_url": "https://avatars0.githubusercontent.com/u/28478049?v=3",
    "gravatar_id": "",
    "url": "https://api.github.com/users/Diamondtest",
    "html_url": "https://github.com/Diamondtest",
    "followers_url": "https://api.github.com/users/Diamondtest/followers",
    "following_url": "https://api.github.com/users/Diamondtest/following{/other_user}",
    "gists_url": "https://api.github.com/users/Diamondtest/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/Diamondtest/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/Diamondtest/subscriptions",
    "organizations_url": "https://api.github.com/users/Diamondtest/orgs",
    "repos_url": "https://api.github.com/users/Diamondtest/repos",
    "events_url": "https://api.github.com/users/Diamondtest/events{/privacy}",
    "received_events_url": "https://api.github.com/users/Diamondtest/received_events",
    "type": "User",
    "site_admin": false,
    "name": null,
    "company": null,
    "blog": "",
    "location": null,
    "email": null,
    "hireable": null,
    "bio": null,
    "public_repos": 0,
    "public_gists": 0,
    "followers": 0,
    "following": 0,
    "created_at": "2017-05-06T08:08:09Z",
    "updated_at": "2017-05-06T08:16:22Z"
}
```

这样，从获取授权，到获得用户信息的流程就走完了。 再根据自己的需求进行用户信息储存，自有登录的接入，用户资料的管理。就完成了一套第三方登录的方案。

目前市面上主流的协议就是 OAuth2.0。 例如 QQ，微信，微博等等。 所以只要搞明白大概流程，那么接入其他供应商的第三方登录也是小菜一碟了。

希望这篇文章对大家有所帮助，有什么意见和想法，也可以在本文底部留言。


