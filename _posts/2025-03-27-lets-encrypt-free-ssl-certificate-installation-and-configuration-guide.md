---
layout: post
title: Let's Encrypt 免费SSL证书安装与配置指南
date: 2025-03-27 09:35
description: "Let's Encrypt提供免费SSL证书，支持自动化部署和更新，适合网站安全升级。指南涵盖安装Certbot、获取证书、配置Nginx及设置自动更新等步骤。"
tags: [Let's Encrypt,SSL证书,HTTPS,Certbot,Nginx配置,网站安全,免费证书,证书自动更新,加密标准,Web安全]
---

# Let's Encrypt 免费SSL证书安装与配置指南

## 为什么选择Let's Encrypt?

![Website Security with HTTPS](https://s.coze.cn/t/iZlAoPm1-Ek/ "HTTPS安全连接")

*Let's Encrypt* 是一个由Mozilla、思科等知名组织发起的免费SSL证书项目，旨在推动互联网从HTTP向HTTPS过渡。其证书已获得主流浏览器信任，安装简便，适合大规模采用。

主要优势包括：
- **完全免费**：无需支付任何费用即可获得可信SSL证书
- **自动化部署**：通过Certbot工具实现一键式安装和更新
- **广泛兼容**：被所有主流浏览器信任
- **安全可靠**：采用最新的加密标准

## 安装准备

在开始安装前，请确保：
- 拥有服务器root权限
- 域名已正确解析到服务器IP
- 服务器已安装Nginx或Apache

## 获取Let's Encrypt证书

![Let's Encrypt SSL证书安装过程](https://s.coze.cn/t/y5SIKnU1P4Q/ "证书安装过程")

Let's Encrypt提供两种获取证书的方式：

### 1. 使用Certbot客户端

```bash
# 安装Certbot
sudo apt-get install certbot python3-certbot-nginx
```

### 2. 两种验证模式

- **--webroot模式**：
  ```bash
  certbot certonly --webroot -w /var/www/example -d example.com -d www.example.com
  ```
  需要指定网站根目录（如/var/www/example）

- **--standalone模式**：
  ```bash
  certbot certonly --standalone -d example.com -d www.example.com
  ```
  自动启用443端口（需先停止占用该端口的服务）

## 配置Nginx使用SSL证书

![Let's Encrypt for Apache and Nginx](https://s.coze.cn/t/BJ5C1Gq5qWY/ "服务器配置")

关键配置步骤：

```nginx
server {
    listen 443 ssl;
    server_name example.com www.example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    # 其他配置...
}
```

## 证书自动更新

Let's Encrypt证书有效期为90天，建议设置自动更新：

```bash
# 测试续订
certbot renew --dry-run

# 设置cron定时任务
0 0 1 */2 * certbot renew --pre-hook "service nginx stop" --post-hook "service nginx start"
```

## 完整流程总结

1. 安装Certbot工具
2. 获取SSL证书（选择webroot或standalone模式）
3. 配置Nginx使用证书
4. 设置定时更新任务

通过以上步骤，您就可以为网站免费启用HTTPS加密，提升安全性和用户信任度。Let's Encrypt让HTTPS部署变得简单易行，是网站安全升级的理想选择。

