---
layout: post
title: Let's Encrypt 使用教程，免费的SSL证书，让你的网站拥抱 HTTPS
date: 2017-01-22 18:59:58 +0800
description: "这篇文章主要讲的就是如何让自己的网站免费从HTTP升级为HTTPS，使用的是 Let's Encrypt的证书。实际上也就是一个Let's Encrypt 免费证书获取教程 。 为什么要上HTTPS，说一个小故事。  从前有个网站，后来有个广告，没了 作为一个博客，自然不想让在被别人浏览的时候，出现莫名的广告（运营商劫持）。这时候，HTTPS的价值就体现出来了。 HTTPS的好处还有很多，但单单这一条，就够我花心思去升级了。 （其实主要目的是提升网站Biger :）  Let's Encrypt 简介  如果要启用HTTPS，我们就需要从证书授权机构(以下简称CA) 处获取一个证书，Let's"
img: cca6c16d-43f9-4aae-b4aa-30398c925eb7.png
tags: [https教程,certbot教程,免费ssl证书,升级https,Let's Encrypt 教程]
---

这篇文章主要讲的就是如何让自己的网站免费从HTTP升级为HTTPS，使用的是 [Let's Encrypt](https://letsencrypt.org/)的证书。实际上也就是一个Let's Encrypt 免费证书获取教程 。
为什么要上HTTPS，说一个小故事。
> 从前有个网站，后来有个广告，没了

作为一个博客，自然不想让在被别人浏览的时候，出现莫名的广告（[运营商劫持](https://www.google.com.hk/webhp?hl=zh-CN&sourceid=cnhp&gws_rd=ssl#safe=strict&hl=zh-CN&q=%E8%BF%90%E8%90%A5%E5%95%86%E5%8A%AB%E6%8C%81)）。这时候，HTTPS的价值就体现出来了。 HTTPS的好处还有很多，但单单这一条，就够我花心思去升级了。 （其实主要目的是提升网站Biger :）

## Let's Encrypt 简介
如果要启用HTTPS，我们就需要从证书授权机构(以下简称CA) 处获取一个证书，Let's Encrypt 就是一个 CA。我们可以从 Let's Encrypt 获得网站域名的免费的证书。这篇文章也主要讲的是通过 Let's Encrypt + Nginx 来让网站升级到HTTPS。

## Certbot 简介
[Certbot](https://certbot.eff.org) 是Let's Encrypt官方推荐的获取证书的客户端，可以帮我们获取免费的Let's Encrypt 证书。Certbot 是支持所有 Unix 内核的操作系统的，个人博客的服务器系统是CentOS 7，这篇教程也是通过在个人博客上启用HTTPS的基础上完成的。

## 获取免费证书
1. 安装Certbot客户端
```shell
yum install certbot
```
2. 获取证书
```shell
certbot certonly --webroot -w /var/www/example -d example.com -d www.example.com
```
> 这个命令会为 example.com 和 www.example.com 这两个域名生成一个证书，使用 `--webroot` 模式会在 `/var/www/example` 中创建 `.well-known` 文件夹，这个文件夹里面包含了一些验证文件，certbot 会通过访问 example.com/.well-known/acme-challenge 来验证你的域名是否绑定的这个服务器。这个命令在大多数情况下都可以满足需求，

但是有些时候我们的一些服务并没有根目录，例如一些微服务，这时候使用 `--webroot` 就走不通了。certbot 还有另外一种模式 `--standalone` ， 这种模式不需要指定网站根目录，他会自动启用服务器的443端口，来验证域名的归属。我们有其他服务（例如nginx）占用了443端口，就必须先停止这些服务，在证书生成完毕后，再启用。
```shell
certbot certonly --standalone -d example.com -d www.example.com
```
证书生成完毕后，我们可以在 `/etc/letsencrypt/live/` 目录下看到对应域名的文件夹，里面存放了指向证书的一些快捷方式。

这时候我们的第一生成证书已经完成了，接下来就是配置我们的web服务器，启用HTTPS。

## Nginx 配置启用 HTTPS
博客系统使用的是Nginx 服务器来转发请求，这里贴一下我的Nginx配置。
```nginx
    server {
        server_name diamondfsd.com www.diamondfsd.com;
        listen 443;
        ssl on;
        ssl_certificate /etc/letsencrypt/live/diamondfsd.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/diamondfsd.com/privkey.pem;

        location / {
           proxy_pass http://127.0.0.1:3999;
           proxy_http_version 1.1;
           proxy_set_header X_FORWARDED_PROTO https;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header Host $host;
        }
    }
    server {
        server_name api.diamondfsd.com;
        listen 443;
        ssl on;
        ssl_certificate /etc/letsencrypt/live/api.diamondfsd.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.diamondfsd.com/privkey.pem;

        location / {
           proxy_pass http://127.0.0.1:4999;
           proxy_http_version 1.1;
           proxy_set_header X_FORWARDED_PROTO https;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header Host $host;

        }
    }

```
主要是监听 `443` 端口，启用 SSL，并配置 SSL 的证书路径（公钥，私钥的路径）。
通过这些配置 我们就已经成功的完成了 Https 的启用。
现在打开我的博客 [https://diamondfsd.com](https://diamondfsd.com)  就可以看到标有 `安全` 的字样。

![alt]({{site.baseurl}}/assets/img/4312f4f1-bd6f-4b60-991d-80e8de186294G)

## 自动更新 SSL 证书
配置完这些过后，我们的工作还没有完成。 Let's Encrypt 提供的证书只有90天的有效期，我们必须在证书到期之前，重新获取这些证书，certbot 给我们提供了一个很方便的命令，那就是 `certbot renew`。
通过这个命令，他会自动检查系统内的证书，并且自动更新这些证书。
我们可以运行这个命令测试一下
```
certbot renew --dry-run
```
我在运行的时候出现了这个错误
> Attempting to renew cert from /etc/letsencrypt/renewal/api.diamondfsd.com.conf produced an unexpected error: At least one of the required ports is already taken.. Skipping.

![alt]({{site.baseurl}}/assets/img/a9f7ee63-9fa4-4dab-902d-b8a46ac31b08y)
这是因为我的api.diamondfsd.com生成证书的时候使用的是 `--standalone` 模式，验证域名的时候，需要启用443端口，这个错误的意思就是要启用的端口已经被占用了。 这时候我必须把`nginx`先关掉，才可以成功。果然，我先运行 `service nginx stop` 运行这个命令，就没有报错了，所有的证书都刷新成功。

证书是90天才过期，我们只需要在过期之前执行更新操作就可以了。 这件事情就可以直接交给定时任务来完成。linux 系统上有 `cron` 可以来搞定这件事情。
我新建了一个文件   `certbot-auto-renew-cron`， 这个是一个 `cron` 计划，这段内容的意思就是 每隔 两个月的 凌晨 2:15 执行 更新操作。
```
15 2 * */2 * certbot renew --pre-hook "service nginx stop" --post-hook "service nginx start"
```
`--pre-hook` 这个参数表示执行更新操作之前要做的事情，因为我有 `--standalone` 模式的证书，所以需要 停止 `nginx` 服务，解除端口占用。
`--post-hook` 这个参数表示执行更新操作完成后要做的事情，这里就恢复 `nginx` 服务的启用

最后我们用 `crontab` 来启动这个定时任务
```
crontab certbot-auto-renew-cron
```

至此，整个网站升级到HTTPS就完成了。 总结一下我们需要做什么
1. 获取Let's Encrypt 免费证书
2. 配置Nginx开启HTTPS
3. 定时刷新证书

> 鸣谢 [Let's Encrypt](https://letsencrypt.org/) 组织以及所有该组织的贡献者支持者 为我们提供 免费的安全证书。

> 参考: [Certbot centosrhel7-nginx](https://certbot.eff.org/#centosrhel7-nginx)
参考: [Let's Encrypt getting-startd](https://letsencrypt.org/getting-started/)
参考: [Archlinux cron](https://wiki.archlinux.org/index.php/Cron_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))
参考: [Nginx configuring-https-servers](http://nginx.org/en/docs/http/configuring_https_servers.html)