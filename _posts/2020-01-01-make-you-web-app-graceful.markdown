---
layout: post
title: [SpringMVC进阶] 利用@ControllerAdvice和ResponseBodyAdvice接口统一处理返回值
date: 2019-6-26 16:05:41
description: "在我们进行Web应用开发的时候，通常需要写很多重复的代码，需要去应对很多重复的逻辑。例如返回值封装，用户状态获取，异常处理，日志打印，错误记录等。本文旨在如何让你的系统变得更加简单好用，让开发人员写更少的代码做更多的事情，更加专注于业务层面，不需要去考虑太多系统层面的东西。"
img:
tags: [spring,spring-mvc,spring-boot,spring-cloud,webapp,web,java,java-web]
---
### 前言

在我们进行Java的Web应用开发时，如何写更少的代码，做更多的事情。如何让开发更容易上手，更专注于业务层面，不需要太关心底层的实现。这里就分享一些我平时在搭建基础框架时候的一些心得体验。

### 一、 [Web篇] 统一处理返回值

在web应用中，通常前后端会定义一个统一的对象来封装返回值，一般除了业务数据之外，可能会包含一些请求相关的数据

例如以下这个对象通过`code`来标识整个请求的结果, `msg`用于返回错误信息, `data`用于返回实际的业务数据。
```json
{
	"code": 0,
	"msg": "success",
	"data": any
}

统一封装的好处就是前端可以统一进行请求的处理，让代码规范化，不需要每个地方都写一套判断请求成功与否的逻辑。

当然这也需要后端做一定的开发。通常我们都是直接写在代码里面，手动去创建一个封装对象，然后将数据set进去，再返回。其实在大部分情况下，这一步的代码都是相同的，今天就介绍一个


```
今天介绍的这个接口， `ResponseBodyAdvice`, 这是由SpringMvc提供的一个接口，在消息转换前处理返回值
```java
public interface ResponseBodyAdvice<T>{
	boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType);
	T beforeBodyWrite(T body, MethodParameter returnType, MediaType selectedContentType,
			Class<? extends HttpMessageConverter<?>> selectedConverterType,
			ServerHttpRequest request, ServerHttpResponse response);
}

```

<div class="mermaid">
  graph LR
      A --- B
      B-->C[fa:fa-ban forbidden]
      B-->D(fa:fa-spinner);
</div>
<script src="https://cdn.bootcss.com/mermaid/8.0.0/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>