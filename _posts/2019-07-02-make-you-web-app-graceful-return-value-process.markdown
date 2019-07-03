---
layout: post
title: SpringMVC进阶 - 利用@ControllerAdvice和ResponseBodyAdvice接口统一处理返回值
date: 2019-6-26 16:05:41
description: "在我们进行Web应用开发的时候，通常需要写很多重复的代码，需要去应对很多重复的逻辑。例如返回值封装，用户状态获取，异常处理，日志打印，错误记录等。本文旨在如何让你的系统变得更加简单好用，让开发人员写更少的代码做更多的事情，更加专注于业务层面，不需要去考虑太多系统层面的东西。"
img:
tags: [spring,spring-mvc,spring-boot,spring-cloud,webapp,web,java,java-web]
---
<script src="https://cdn.bootcss.com/mermaid/8.0.0/mermaid.min.js"></script>

### 前言

在我们进行Java的Web应用开发时，如何写更少的代码，做更多的事情。如何让开发更容易上手，更专注于业务层面，不需要太关心底层的实现。这里就分享一些我平时在搭建基础框架时候的一些心得体验。

[Web篇] 统一处理返回值

在web应用中，通常前后端会定义一个统一的对象来封装返回值，一般除了业务数据之外，可能会包含一些请求相关的数据

例如以下这个对象
- `code`来标识整个请求的结果  
- `msg`用于返回错误信息
- `data`用于返回实际的业务数据。
```json
{
	"code": 0,
	"msg": "success",
	"data": any
}
```
统一封装的好处就是前端可以使用统一的逻辑进行请求处理，能够编写通用代码来处理返回值。

当然这也需要后端做一定的开发。通常我们都是直接写在代码里面，手动去创建一个封装对象，然后将数据set进去，或者是封装类添加一些静态方法之类的。 在大部分情况下，这些工作都是重复的。


### ResponseBodyAdvice 的执行流程
今天介绍的这个接口， `ResponseBodyAdvice`, 这是由SpringMvc提供的一个接口，在消息转换前处理返回值，源码如下：
```java
public interface ResponseBodyAdvice<T>{
	boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType);
	T beforeBodyWrite(T body, MethodParameter returnType, MediaType selectedContentType,
			Class<? extends HttpMessageConverter<?>> selectedConverterType,
			ServerHttpRequest request, ServerHttpResponse response);
}
```
这个接口在返回值被消息转换器写回前端之前进行处理， 大致处理流程如下： 

<div class="mermaid">
  graph LR
      A[DispatchServlet.doDispatch] -- "执行业务逻辑获得返回值" --> B[HttpEntityMethodProcessor.handleReturnValue]
	  B -- "执行切面" --> C[RequestResponseBodyAdviceChain.beforeBodyWrite]
	  C -- "自定义处理返回值" --> D[RequestResponseBodyAdviceChain.processBody]
	  D -- "通用消息转换器转换写回" --> E[HttpMessageConverter.write]
	  E --> F[请求完成]
</div>

我们实现这个接口的代码主要在这个方法里被调用 `RequestResponseBodyAdviceChain.processBody`， 可以看到这一段逻辑很简单

先执行`ResponseBodyAdvice.supports`看当前切面类是否支持，如果支持再调用`ResponseBodyAdvice.beforeBodyWrite`方法并返回

返回值会被 `HttpMessageConverter.write` 接口在进行最终的转换（例如转JSON），然后写回前端

```java
private <T> Object processBody(@Nullable Object body, MethodParameter returnType, MediaType contentType,
		Class<? extends HttpMessageConverter<?>> converterType,
		ServerHttpRequest request, ServerHttpResponse response) {

	for (ResponseBodyAdvice<?> advice : getMatchingAdvice(returnType, ResponseBodyAdvice.class)) {
		if (advice.supports(returnType, converterType)) {
			body = ((ResponseBodyAdvice<T>) advice).beforeBodyWrite((T) body, returnType,
					contentType, converterType, request, response);
		}
	}
	return body;
}
```

### `ResponseBodyAdvice` 的初始化
SpringMVC在初始化的时候， 会调用这个方法`RequestMappingHandlerAdapter.initControllerAdviceCache`，将ResponseBodyAdvice初始化到内存中

这里面会调用`ControllerAdviceBean.findAnnotatedBeans` 这个方法，获取所有带有 `@ControllerAdvice` 注解的类，并且会将所有实现了 `ResponseBodyAdvice` 接口的Bean放入 `requestResponseBodyAdviceBeans`中， 在之前介绍到的 `getAdvice()` 方法取得就是该对象。
```java
//代码片段
public static List<ControllerAdviceBean> findAnnotatedBeans(ApplicationContext context) {
	return Arrays.stream(BeanFactoryUtils.beanNamesForTypeIncludingAncestors(context, Object.class))
			.filter(name -> context.findAnnotationOnBean(name, ControllerAdvice.class) != null)
			.map(name -> new ControllerAdviceBean(name, context))
			.collect(Collectors.toList());
}

// 代码片段
for (ControllerAdviceBean adviceBean : adviceBeans) {
	Class<?> beanType = adviceBean.getBeanType();
	if (beanType == null) {
		throw new IllegalStateException("Unresolvable type for ControllerAdviceBean: " + adviceBean);
	}
	Set<Method> attrMethods = MethodIntrospector.selectMethods(beanType, MODEL_ATTRIBUTE_METHODS);
	if (!attrMethods.isEmpty()) {
		this.modelAttributeAdviceCache.put(adviceBean, attrMethods);
	}
	Set<Method> binderMethods = MethodIntrospector.selectMethods(beanType, INIT_BINDER_METHODS);
	if (!binderMethods.isEmpty()) {
		this.initBinderAdviceCache.put(adviceBean, binderMethods);
	}
	if (RequestBodyAdvice.class.isAssignableFrom(beanType)) {
		requestResponseBodyAdviceBeans.add(adviceBean);
	}
	if (ResponseBodyAdvice.class.isAssignableFrom(beanType)) {
		requestResponseBodyAdviceBeans.add(adviceBean);
	}
}
```

了解到这些，我们实现一个通用的返回值处理就很简单了， 只需要实现 `ResponseBodyAdvice` 接口，并且加上 `@ControllerAdvice` 注解就可以了

这是我实现的一个，统一封装返回值的实现， 大家可以参考一下，根据自己的业务需求来进行修改

```java
package com.diamondfsd.fast.mvc.advice;

import com.diamondfsd.fast.mvc.annotations.IgnoreAware;
import com.diamondfsd.fast.mvc.entity.FastResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.WeakHashMap;

/**
 * 统一返回数据封装
 * @author Diamond
 */
@ControllerAdvice
public class FastMvcResponseBodyAwareAdvice implements ResponseBodyAdvice<Object> {

    private final Map<Method, Boolean> supportsCache = new WeakHashMap<>();

    private final String [] basePackages;
    private ObjectMapper objectMapper = new ObjectMapper();

    public FastMvcResponseBodyAwareAdvice(String [] basePackages) {
        this.basePackages = basePackages;
    }

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        if (supportsCache.containsKey(returnType.getMethod())) {
            return supportsCache.get(returnType.getMethod());
        }
        boolean isSupport = getIsSupport(returnType);
        supportsCache.put(returnType.getMethod(), isSupport);
        return isSupport;
    }

    private boolean getIsSupport(MethodParameter returnType) {
        Class<?> declaringClass = returnType.getMember().getDeclaringClass();

        IgnoreAware classIgnore = declaringClass.getAnnotation(IgnoreAware.class);
        IgnoreAware methodIgnore = returnType.getMethod().getAnnotation(IgnoreAware.class);
        if (classIgnore != null || methodIgnore != null || FastResult.class.equals(returnType.getGenericParameterType())) {
            return false;
        }
        for (int i = 0; i < basePackages.length; i++) {
            if (declaringClass.getPackage().getName().startsWith(basePackages[i])) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType, ServerHttpRequest request,
                                  ServerHttpResponse response) {
        FastResult<Object> result = new FastResult<>();
        result.setData(body);
        if (returnType.getGenericParameterType().equals(String.class)) {
            try {
                response.getHeaders().set("Content-Type", "application/json;charset=utf-8");
                return objectMapper.writeValueAsString(result);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
        return result;
    }

}
```
<script>mermaid.initialize({startOnLoad:true});</script>