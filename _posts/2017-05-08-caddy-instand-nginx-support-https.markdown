---
layout: post
title: 使用 Caddy 替代 Nginx，全站升级 https，配置更加简单
date: 2017-05-08 17:11:58 +0800
description: "Caddy 是什么？  Caddy 是一个多功能的 HTTP web服务器，并且使用Let's Encrypt提供的免费证书，自动让网站升级到HTTPS  Every Site on HTTPS Caddy is a general-purpose HTTP/2 web server that serves HTTPS by default. Fork Caddy On Github 为什么要使用 Caddy  安全 Caddy 是一个默认使用https协议的web服务器 无依赖 Caddy 使用 Go 语言编写，编译好的二进制文件能够运行在任何支持Go语言的平台，不需要自己安装任何库。 使用"
img:
tags: [https,caddy教程,https教程]
---

 ## Caddy 是什么？
Caddy 是一个多功能的 HTTP web服务器，并且使用[Let's Encrypt](https://letsencrypt.org/)提供的免费证书，自动让网站升级到HTTPS
> Every Site on HTTPS
> Caddy is a general-purpose HTTP/2 web server that serves HTTPS by default.
> [Fork Caddy On Github](https://github.com/mholt/caddy)

## 为什么要使用 Caddy
1. **安全**
Caddy 是一个默认使用https协议的web服务器
2.  **无依赖**
Caddy 使用 Go 语言编写，编译好的二进制文件能够运行在任何支持Go语言的平台，不需要自己安装任何库。
3. **使用简单**
Caddy 的配置简单，不管你是新的web开发者，还是专业人士，都能够快速上手

## 安装以及运行
1. 下载 [Caddy download](https://caddyserver.com/download)
在官网上选择指定的平台，下载指定平台的运行包。 这里以 CentOS 7.0 x64 为例。 选择 Linux 64-bit，然后点  DOWNLOAD。
通过ftp将下载好的包上传到服务器，或者复制出下载地址直接在服务端 `wget https://caddyserver.com/download/linux/amd64`。
使用 `wget` 的模式下载下来的文件名是 `amd64`。 `tar -xzvf amd64` 解压， 解压后文件如下。
![alt]({{site.baseurl}}/assets/img/77ae413f-749e-4bf8-9b75-613cf6d00220.png)
我们可以直接运行 ./caddy，这样就启动了一个静态的web服务器，根目录为当前目录，端口为 `2015`，可以通过你服务器的ip地址加上:2015 进行访问了。 如果你访问的时候，报404异常，在你当前目录下添加一个 index.html 文件即可。

## Caddyfile 配置
这里我们看一下官网的例子说明 [Caddy Documentation](https://caddyserver.com/docs)
```
:2015                    # Host: (any), Port: 2015
localhost                # Host: localhost; Port: 2015
localhost:8080           # Host: localhost; Port: 8080
example.com              # Host: example.com; Ports: 80->443
http://example.com       # Host: example.com; Port: 80
https://example.com      # Host: example.com; Ports: 80->443
http://example.com:1234  # Host: example.com; Port: 1234
https://example.com:80   # Error! HTTPS on port 80
*.example.com            # Hosts: *.example.com; Port: 2015
example.com/foo/         # Host: example.com; Ports: 80, 443; Path: /foo/
/foo/                    # Host: (any), Port: 2015, Path: /foo/
```
通过上面这些例子，就可以大概了解到Caddy的域名适配规则。


这个是我的所有站点的配置，可以看出来相比Nginx简单了很多:
`log` 用于记录访问日志
`gzip` 用于启用gzip压缩
`proxy` 用于支持反向代理
`websocket` 用于支持websocket协议
所有的插件文档，可以  [Caddy Documentation](https://caddyserver.com/docs) 从官方文档上看到，都有详细的配置说明，简单易上手。
使用 `caddy -conf Caddyfile` 就可以使用配置文件来启动，确保80和443端口没有被服务占用。
`Caddyfile` 文件:
```
diamondfsd.com {  # 启动 http 和 https，访问 http 会自动转跳到 https
        log access_log.log  # 日志
        gzip  # 使用gzip压缩
        proxy / http://127.0.0.1:3999 { # 路径转发
                header_upstream Host {host}
                header_upstream X-Real-IP {remote}
                header_upstream X-Forwarded-For {remote}
                header_upstream X-Forwarded-Proto {scheme}
        }
}

http://api.diamondfsd.com https://api.diamondfsd.com {  # 同时启用 http 和 https 不会自动转跳
        gzip
        proxy / http://127.0.0.1:4999 {
                header_upstream Host {host}
                header_upstream X-Real-IP {remote}
                header_upstream X-Forwarded-For {remote}
                header_upstream X-Forwarded-Proto {scheme}
        }
}

hook.diamondfsd.com {
        proxy / http://127.0.0.1:9000 {
                header_upstream Host {host}
                header_upstream X-Real-IP {remote}
                header_upstream X-Forwarded-For {remote}
                header_upstream X-Forwarded-Proto {scheme}
        }
}

http://file.diamondfsd.com {
        proxy / http://127.0.0.1:22222
}

https://file.diamondfsd.com {
        root /data/file-upload  # 指定静态文件根目录
}

yd.diamondfsd.com {
        gzip
        root /data/ydig
        proxy /ws http://127.0.0.1:9001 {  # 转发所有 /ws 为 websocket
                websocket
        }
}

8.diamondfsd.com {
        gzip
        root /data/quaver
}
```

在对比同等情况下 nginx 的配置:
```nginx
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    gzip on;
    gzip_min_length 1k;
    gzip_buffers 16 64k;
    gzip_http_version 1.1;
    gzip_comp_level 6;
    gzip_types application/json application/xml text/plain application/javascript text/css image/jpeg image/gif image/png text/javascript;
    gzip_vary on;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.

    server {
        listen 80;
        server_name diamondfsd.com www.diamondfsd.com;
        rewrite ^(.*) https://$server_name$1 permanent;
    }

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

    server {
     	server_name api.diamondfsd.com;
		listen 80;
        location / {
           proxy_pass http://127.0.0.1:4999;
           proxy_http_version 1.1;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header Host $host;
        }
    }

    server {
        server_name hook.diamondfsd.com;
        listen 80;
        location / {
           proxy_pass http://127.0.0.1:9000;
           proxy_http_version 1.1;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header Host $host;
        }

    }

    server {
       server_name file.diamondfsd.com;
       listen 80;
       location / {
           proxy_pass http://127.0.0.1:22222;
           proxy_http_version 1.1;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header Host $host;
       }
    }

    server {
		server_name file.diamondfsd.com;
		listen 443;
		ssl on;
		ssl_certificate /etc/letsencrypt/live/file.diamondfsd.com/fullchain.pem;
		ssl_certificate_key /etc/letsencrypt/live/file.diamondfsd.com/privkey.pem;

		root /data/file-upload;
		expires max;
        access_log /data/file-domain.log;
    }

    server {
        listen 80;
        server_name yd.diamondfsd.com;
        rewrite ^(.*) https://$server_name$1 permanent;
    }

    server {
		server_name yd.diamondfsd.com;
		listen 443;
		ssl on;
		ssl_certificate /etc/letsencrypt/live/yd.diamondfsd.com/fullchain.pem;
		ssl_certificate_key /etc/letsencrypt/live/yd.diamondfsd.com/privkey.pem;

		location /ws/ {
		   proxy_pass http://127.0.0.1:9001;
		   proxy_http_version 1.1;
		   proxy_set_header Host $host;
		   proxy_set_header Upgrade $http_upgrade;
		   proxy_set_header Connection "upgrade";
		}

		root /data/ydig;
		expires max;
		access_log /data/ydig-domain.log;
    }

    server {
        listen 80;
        server_name about.diamondfsd.com;
        rewrite ^(.*) https://$server_name$1 permanent;
    }

    server {
		server_name about.diamondfsd.com;
		listen 443;
		ssl on;
		ssl_certificate /etc/letsencrypt/live/about.diamondfsd.com/fullchain.pem;
		ssl_certificate_key /etc/letsencrypt/live/about.diamondfsd.com/privkey.pem;

		root /data/about-me;
		expires max;
		access_log /data/about-me-domain.log;
    }
    server {
        server_name 8.diamondfsd.com;
		listen 80;
        rewrite ^(.*) https://$server_name$1 permanent;
    }
    server {
		server_name 8.diamondfsd.com;
		listen 443;
		ssl on;
		ssl_certificate /etc/letsencrypt/live/8.diamondfsd.com/fullchain.pem;
		ssl_certificate_key /etc/letsencrypt/live/8.diamondfsd.com/privkey.pem;

		root /data/quaver;
		expires max;
		access_log /data/quaver-domain.log;
    }
}

```

可以看出，相较于Nginx来说，Caddy 的配置简单了很多，而且默认启用了 https，更加的安全。
这篇文章也比较简单，更高级的应用大家可以去阅读官方文档。
有什么问题和简介，欢迎大家相互讨论。