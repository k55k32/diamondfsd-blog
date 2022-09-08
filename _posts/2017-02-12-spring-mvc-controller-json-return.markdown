---
layout: post
title: Spring MVC 更灵活的控制 json 返回（自定义过滤字段）
date: 2017-02-12 11:41:53 +0800
description: "这篇文章主要讲 Spring MVC 如何动态的去返回 Json 数据  在我们做 Web 接口开发的时候， 经常会遇到这种场景。  两个请求，返回同一个对象，但是需要的返回字段并不相同。如以下场景..."
img:
tags: [jackson 动态过滤字段,Spring MVC 动态返回 JSON,HandlerMethodReturnValueHandler教程,SpringMVC动态过滤字段]
---

这篇文章主要讲 Spring MVC 如何动态的去返回 Json 数据
在我们做 Web 接口开发的时候， 经常会遇到这种场景。
> 两个请求，返回同一个对象，但是需要的返回字段并不相同。如以下场景
```java
/**
* 返回所有名称以及Id
*/
@RequestMapping("list")
@ResponseBody
public List<Article> findAllNameAndId() {
  return articleService.findAll();
}

/**
* 返回所有目录详情
*/
@RequestMapping("list-detail")
@ResponseBody
public List<Article> findAllDetail() {
  return articleService.findAll();
}
```

Spring MVC 默认使用转json框架是 `jackson`。 大家也知道， `jackson` 可以在实体类内加注解，来指定序列化规则，但是那样比较不灵活，不能实现我们目前想要达到的这种情况。
这篇文章主要讲的就是通过自定义注解，来更加灵活，细粒化控制 json 格式的转换。
最终我们需要实现如下的效果:
```java

@RequestMapping(value = "{id}", method = RequestMethod.GET)
// 返回时候不包含 filter 内的 createTime, updateTime 字段
@JSON(type = Article.class, filter="createTime,updateTime")
public Article get(@PathVariable String id) {
    return articleService.get(id);
}
@RequestMapping(value="list", method = RequestMethod.GET)
// 返回时只包含 include 内的 id, name 字段
// 可以使用多个 @JSON 注解，如果是嵌套对象的话
@JSON(type = Article.class  , include="id,name,createTime")
@JSON(type = Tag.class, include="id,name")
public List<Article> findAll() {
    return articleService.findAll();
}
```

## jackson 编程式过滤字段
`jackson` 中， 我们可以通过 `ObjectMapper.setFilterProvider` 来进行过滤规则的设置，jackson 内置了一个 `SimpleFilterProvider` 过滤器，这个过滤器功能比较单一，不能很好的支持我们想要的效果。于是我自己实现了一个过滤器 `JacksonJsonFilter`
```java
package diamond.cms.server.json;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonFilter;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.BeanPropertyFilter;
import com.fasterxml.jackson.databind.ser.FilterProvider;
import com.fasterxml.jackson.databind.ser.PropertyFilter;
import com.fasterxml.jackson.databind.ser.PropertyWriter;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;

@SuppressWarnings("deprecation")
@JsonFilter("JacksonFilter")
public class JacksonJsonFilter extends FilterProvider{

    Map<Class<?>, Set<String>> includeMap = new HashMap<>();
    Map<Class<?>, Set<String>> filterMap = new HashMap<>();

    public void include(Class<?> type, String[] fields) {
        addToMap(includeMap, type, fields);
    }

    public void filter(Class<?> type, String[] fields) {
        addToMap(filterMap, type, fields);
    }

    private void addToMap(Map<Class<?>, Set<String>> map, Class<?> type, String[] fields) {
        Set<String> fieldSet = map.getOrDefault(type, new HashSet<>());
        fieldSet.addAll(Arrays.asList(fields));
        map.put(type, fieldSet);
    }

    @Override
    public BeanPropertyFilter findFilter(Object filterId) {
        throw new UnsupportedOperationException("Access to deprecated filters not supported");
    }

    @Override
    public PropertyFilter findPropertyFilter(Object filterId, Object valueToFilter) {

        return new SimpleBeanPropertyFilter() {

            @Override
            public void serializeAsField(Object pojo, JsonGenerator jgen, SerializerProvider prov, PropertyWriter writer)
                    throws Exception {
                if (apply(pojo.getClass(), writer.getName())) {
                    writer.serializeAsField(pojo, jgen, prov);
                } else if (!jgen.canOmitFields()) {
                    writer.serializeAsOmittedField(pojo, jgen, prov);
                }
            }
        };
    }

    public boolean apply(Class<?> type, String name) {
        Set<String> includeFields = includeMap.get(type);
        Set<String> filterFields = filterMap.get(type);
        if (includeFields != null && includeFields.contains(name)) {
            return true;
        } else if (filterFields != null && !filterFields.contains(name)) {
            return true;
        } else if (includeFields == null && filterFields == null) {
            return true;
        }
        return false;
    }

}
```

通过这个过滤器，我们可以实现
```java
class Article {
  private String id;
  private String title;
  private String content;
 // ... getter/setter
}

// Demo
class Demo {
  public void main(String args[]) {
    ObjectMapper mapper = new ObjectMapper();
    JacksonJsonFilter jacksonFilter = new JacksonJsonFilter();

    // 过滤除了 id,title 以外的所有字段，也就是序列化的时候，只包含 id 和 title
    jacksonFilter.include(Article.class, "id,title");
    mapper.setFilterProvider(jacksonFilter);  // 设置过滤器
    mapper.addMixIn(Article.class, jacksonFilter.getClass()); // 为Article.class类应用过滤器
    String include= mapper.writeValueAsString(new Article());


    // 序列化所有字段，但是排除 id 和 title，也就是除了 id 和 title之外，其他字段都包含进 json
    jacksonFilter = new JacksonJsonFilter();
    jacksonFilter.filter(Article.class, "id,title");
    mapper = new ObjectMapper();
    mapper.setFilterProvider(jacksonFilter);
    mapper.addMixIn(Article.class, jacksonFilter.getClass());

    String filter = mapper.writeValueAsString(new Article());

    System.out.println("include:" + include);
    System.out.println("filter :" + filter);
  }
}

输出结果
filterOut:{id: "", title: ""}
serializeAll:{content:""}
```

## 自定义 `@JSON` 注解
我们需要实现文章开头的那种效果。这里我自定义了一个注解，可以加在方法上，这个注解是用来携带参数给 `CustomerJsonSerializer.filter` 方法的，就是某个类的某些字段需要过滤或者包含。这里我们定义了两个注解  `@JSON` 和 `@JSONS` ， 是为了放方法支持 多重 `@JSON` 注解
```java
package diamond.cms.server.json;

import java.lang.annotation.ElementType;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Repeatable(JSONS.class)   // 让方法支持多重@JSON 注解
public @interface JSON {
    Class<?> type();
    String include() default "";
    String filter() default "";
}

package diamond.cms.server.json;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface JSONS {
    JSON [] value();
}
```


## 封装 JSON 转换
注解有了，过滤器也有了，那么我们来封装一个类，用作解析注解以及设置过滤器的。 `CustomerJsonSerializer.java`

```java
package diamond.cms.server.json;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * depend on jackson
 * @author Diamond
 */
public class CustomerJsonSerializer {


    ObjectMapper mapper = new ObjectMapper();
    JacksonJsonFilter jacksonFilter = new JacksonJsonFilter();

    /**
     * @param clazz target type
     * @param include include fields
     * @param filter filter fields
     */
    public void filter(Class<?> clazz, String include, String filter) {
        if (clazz == null) return;
        if (StringUtils.isNotBlank(include)) {
            jacksonFilter.include(clazz, include.split(","));
        }
        if (StringUtils.isNotBlank(filter)) {
            jacksonFilter.filter(clazz, filter.split(","));
        }
        mapper.addMixIn(clazz, jacksonFilter.getClass());
    }

    public String toJson(Object object) throws JsonProcessingException {
        mapper.setFilterProvider(jacksonFilter);
        return mapper.writeValueAsString(object);
    }
    public void filter(JSON json) {
        this.filter(json.type(), json.include(), json.filter());
    }
}

```
我们之前的 Demo 可以变成:
```java
// Demo
class Demo {
  public void main(String args[]) {
    CustomerJsonSerializer cjs= new CustomerJsonSerializer();
    // 设置转换 Article 类时，只包含 id, name
    cjs.filter(Article.class, "id,name", null);

    String include = cjs.toJson(new Article());

    cjs = new CustomerJsonSerializer();
    // 设置转换 Article 类时，过滤掉 id, name
    cjs.filter(Article.class, null, "id,name");

    String filter = cjs.toJson(new Article());

    System.out.println("include: " + include);
    System.out.println("filter: " + filter);
  }
}
// -----------------------------------
输出结果
include: {id: "", title: ""}
filter: {content:""}
```

## 实现 Spring MVC 的 `HandlerMethodReturnValueHandler`
`HandlerMethodReturnValueHandler` 接口 Spring MVC 用于处理请求返回值 。
看一下这个接口的定义和描述，接口有两个方法`supportsReturnType` 用来判断 处理类 是否支持当前请求， `handleReturnValue` 就是具体返回逻辑的实现。
```java
 // Spring MVC 源码
package org.springframework.web.method.support;

import org.springframework.core.MethodParameter;
import org.springframework.web.context.request.NativeWebRequest;

public interface HandlerMethodReturnValueHandler {

	boolean supportsReturnType(MethodParameter returnType);

	void handleReturnValue(Object returnValue, MethodParameter returnType,
			ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception;

}

```

我们平时使用 `@ResponseBody` 就是交给 `RequestResponseBodyMethodProcessor` 这个类处理的
还有我们返回 `ModelAndView` 的时候， 是由 `ModelAndViewMethodReturnValueHandler` 类处理的
要实现文章开头的效果，我实现了一个 `JsonReturnHandler`类，当方法有 `@JSON` 注解的时候，使用该类来处理返回值。
```java
package diamond.cms.server.json.spring;

import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodReturnValueHandler;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import diamond.cms.server.json.CustomerJsonSerializer;
import diamond.cms.server.json.JSON;

public class JsonReturnHandler implements HandlerMethodReturnValueHandler{

    @Override
    public boolean supportsReturnType(MethodParameter returnType) {
        // 如果有我们自定义的 JSON 注解 就用我们这个Handler 来处理
        boolean hasJsonAnno= returnType.getMethodAnnotation(JSON.class) != null;
        return hasJsonAnno;
    }

    @Override
    public void handleReturnValue(Object returnValue, MethodParameter returnType, ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest) throws Exception {
        // 设置这个就是最终的处理类了，处理完不再去找下一个类进行处理
        mavContainer.setRequestHandled(true);

        // 获得注解并执行filter方法 最后返回
        HttpServletResponse response = webRequest.getNativeResponse(HttpServletResponse.class);
        Annotation[] annos = returnType.getMethodAnnotations();
        CustomerJsonSerializer jsonSerializer = new CustomerJsonSerializer();
        Arrays.asList(annos).forEach(a -> { // 解析注解，设置过滤条件
            if (a instanceof JSON) {
                JSON json = (JSON) a;
                jsonSerializer.filter(json);
            } else if (a instanceof JSONS) { // 使用多重注解时，实际返回的是 @Repeatable(JSONS.class) 内指定的 @JSONS 注解
                JSONS jsons = (JSONS) a;
                Arrays.asList(jsons.value()).forEach(json -> {
                    jsonSerializer.filter(json);
                });
            }
        });

        response.setContentType(MediaType.APPLICATION_JSON_UTF8_VALUE);
        String json = jsonSerializer.toJson(returnValue);
        response.getWriter().write(json);
    }
}
```

通过这些，我们就可以最终实现以下效果。
```java
class Tag {
  private String id;
  private String tagName;
}
class Article {
  private String id;
  private String title;
  private String content;
  private Long createTime;

 // ... getter/setter
}

@Controller
@RequestMapping("article")
class ArticleController {
  @RequestMapping(value = "{id}", method = RequestMethod.GET)
  @JSON(type = Article.class, filter="createTime")
  public Article get(@PathVariable String id) {
      return articleService.get(id);
  }

  @RequestMapping(value="list", method = RequestMethod.GET)
  @JSON(type = Article.class  , include="id,title")
  @JSON(type = Tag.class, filter="id")
  public List<Article> findAll() {
      return articleService.findAll();
  }
}
```
请求 `/article/{articleId}`
```js
{
    id: "xxxx",
    title: "xxxx",
    content: "xxxx",
    tag: {
       id: "",
       tagName: ""
    }
}
```

请求 `article/list`
```js
[ {id: "xx", title: "", tag: {name: ""} }, {id: "xx", title: "", tag: {name: ""} }, {id: "xx", title: "", tag: {name: ""}} ... ]
```


## 博客源码
以上就是这篇教程的全部内容了。 我博客系统的后台，就是使用的这种方式来 自定义返回字段的。
上面这些代码都是为了写教程有一定的精简，  完整的可以看 github 上的源码
[Blog-End-Json-Serializer](https://github.com/k55k32/cms-admin-end/tree/master/src/main/java/diamond/cms/server/json) 序列化的部分
[Blog-End-Full-Code](https://github.com/k55k32/cms-admin-end)  整个博客后台的代码
