---
layout: post
title: 通过 Github-Webhook 实现的轻量级自动化构建Nodejs微服务
date: 2017-02-13 21:33:11 +0800
description: "我想要实现这样的功能，只要我 push 代码到 github仓库中，那么我的服务器就会自动执行预先写好的脚本。 类似于：  拉取最新代码 更新项目依赖 编译 重启项目 有很多持续集成工具都可以实现这样的功能，可是我的服务器内存小呀，没那么多资源去部署一个持续化集成工具了，只能自己写一个轻量级工具来完成这项工作。  Github Webhooks 详解  我们每个github仓库可以都在 Settings -> Webhooks -> Add webhooks 配置 Webhooks。配置这个的作用就是让代码库有某些动作的时候，将这些信息提交到我们指定的服务器地址上。  我个人代码库的配置信息如"
img: abc07074-3bf1-40ca-8059-30dd5320965f.jpg
tags: [webhooks教程,github-webhooks教程,githook-express,自动化部署]
---

我想要实现这样的功能，只要我 `push` 代码到 [github](https://github.com/k55k32/cms-front)仓库中，那么我的服务器就会自动执行预先写好的脚本。
类似于：
1. 拉取最新代码
2. 更新项目依赖
3. 编译
4. 重启项目

有很多持续集成工具都可以实现这样的功能，可是我的服务器内存小呀，没那么多资源去部署一个持续化集成工具了，只能自己写一个轻量级工具来完成这项工作。

## Github Webhooks 详解
我们每个github仓库可以都在  `Settings -> Webhooks -> Add webhooks` 配置 `Webhooks`。配置这个的作用就是让代码库有某些动作的时候，将这些信息提交到我们指定的服务器地址上。

我个人代码库的配置信息如下
![alt]({{site.baseurl}}/assets/img/ccab3b20-1528-42bd-a70b-65b3414f0350d)

### Payload URL
用于接收 `Webhook` 请求的接口地址

### Content type
请求时数据类型，有两种可选
1. `application/json`，返回类似 `{ key1: value, key2: value ...}`  的json串
2. `application/x-www-form-urlencoded `， 返回类似 `key1=value1&key2=value2...` 的键值对

### Secret
为了让我们自身服务器信任这次请求不是伪造的，我们会在配置 `Webhooks` 的时候填写一个 `Secret` 信息。Github 每次请求我们接口的时候，都会将请求的数据和我们配置的 `Secret` 来进行 `HMAC-SHA1` 签名，然后放入请求头 `X-Hub-Signature` 中，以便我们服务器进行签名验证。

### Which events would you like to trigger this webhook?
选择需要触发 `webhook` 的事件，我这里就选默认，当有 `push` 事件的时候触发。更多其他事件可以参考官方文档 [github-webhooks#evnets](https://developer.github.com/webhooks/#events)

配置好后，最后的请求信息如下:
>### Headers （请求头）
```
Request URL: http://42.96.203.79:9000/github/webhook
Request method: POST
content-type: application/json
Expect:
User-Agent: GitHub-Hookshot/886c556
X-GitHub-Delivery: 5e4faa80-f1b6-11e6-82ca-b15a28b37514
X-GitHub-Event: push
X-Hub-Signature: sha1=******************************************
```
> ### Payload （请求携带的数据）
```
{
  "ref": "refs/heads/master", // 属于哪个分支
  "before": "af93824edb56a00ce161ac66c90fe2e7390d3b05",
  "after": "ffe1d63eef115407bfb046de5b2fa9cb226bcfa9",
  "created": false,
  "deleted": false,
  "forced": false,
  "base_ref": null,
  "compare": "https://github.com/k55k32/cms-front/compare/af93824edb56...ffe1d63eef11",
  "repository": {
    "id": 74550213,
    "name": "cms-front",
    "full_name": "k55k32/cms-front",
    "owner": {
      "name": "k55k32",
      "email": "diamondfsd@gmail.com"
    },
    "private": false,
    "html_url": "https://github.com/k55k32/cms-front",
    "description": "my-blog",
    "fork": false,
    "url": "https://github.com/k55k32/cms-front",  // 项目的 url
    "forks_url": "https://api.github.com/repos/k55k32/cms-front/forks",
    "keys_url": "https://api.github.com/repos/k55k32/cms-front/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/k55k32/cms-front/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/k55k32/cms-front/teams",
    "hooks_url": "https://api.github.com/repos/k55k32/cms-front/hooks"
  }
  ... 太长了，就不全部贴上了，大概有效的信息就这些
}
```

## [Githook-express  Nodejs 服务](https://github.com/k55k32/githook-express)
[githook-express](https://github.com/k55k32/githook-express) 这是我写的一个小服务，用于接收并解析`webhook`请求，并通过配置文件，执行指定的脚本，实现自动编译部署发布等功能。

而且这个服务在服务器上只占用了 33M 的内存，完全符合我目前的需求。
![alt]({{site.baseurl}}/assets/img/df49f0c9-3f15-46df-bcca-792d66c67627f)

### 核心代码
```js
app.post('/github/webhook', function (req, res) {
    // 获取当前服务配置
    var config = utils.getConfig(configPath)
    console.log('read config file:', config)
    // 获取事件名称
    var eventName = req.get('X-GitHub-Event')
    // 获取签名信息
    var sign = req.get('X-Hub-Signature')
    var delivery = req.get('X-GitHub-Delivery')
    console.log(new Date(), ' [HOOK REQUEST]')
    console.log('event:', eventName)
    console.log('sign:', sign)
    console.log('delivery:', delivery)
    // 获取仓库地址
    var repositoryUrl = req.body.repository.url
    // 获取分支信息
    var refHead = req.body.ref
    console.log('push head', refHead)
    console.log('repositoryUrl: ', repositoryUrl)
    // 查找配置文件中，是否有该仓库的配置
    var executer = config[repositoryUrl]
    console.log('executer: ', executer)
    // 如果有配置，并且分支为 `master` 分支，就继续执行
    if (executer && refHead === 'refs/heads/master') {
      var secret = executer.secret
      var shell = executer.events[eventName] // 获取仓库事件需要执行的代码
      if (shell) {
        if (vaildHMAC(secret, req._body, sign)) { // 验证签名
          setTimeout(() => {
            console.log('new thread execute shell', shell)
            exec(shell, (err,stdout,stderr) => { // 执行配置文件中对应的脚本
              if (stdout) {
                console.log('stdout out >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                console.log(stdout) // 输出脚本执行结果
                console.log('stdout over >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
              }

              err && console.log('hasErr: ', err)
              stderr && console.log('stderr: ', stderr)
            })
          }, 500)
        } else {
          console.log('vaild sha1 error: ',secret , sign);
        }
      } else {
        console.log('not event target: ', eventName)
      }
    }
    res.end()
})
```

### 配置文件
是一个 json 数据文件，以仓库名称作为key，然后存放着 `webhook` 上配置的 `secret`，还有对应事件需要执行的脚本文件。
```
{
  "https://github.com/k55k32/MessageWar": {
    "secret": "github-hook-message-**********************",
    "events": {
      "push": "/root/msg-war-deply.sh"
    }
  },
  "https://github.com/k55k32/MessageWar-Websocket": {
    "secret": "oh-no-i'm-so-**********************",
    "events": {
      "push": "/root/websocket-msg-deply.sh"
    }
  },
  "https://github.com/k55k32/cms-admin-end": {
    "secret": "we-are-both-y**********************",
    "events": {
      "push": "/root/repositories/cms-admin-end/start.sh"
    }
  },
  "https://github.com/k55k32/cms-front": {
    "secret": "ihave-no-idea-**********************",
    "events": {
      "push": "/root/repositories/cms-front/start.sh"
    }
  }
}
```
这里就是介绍了一下 `Webhooks` 在实际当中的一个简单应用，有更多想法，大家可以交流交流。