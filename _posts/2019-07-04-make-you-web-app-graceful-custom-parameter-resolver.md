---
layout: post
title: SpringMVC进阶 - 利用HandlerMethodArgumentResolver接口实现自定义参数类型解析
date: 2019-6-26 16:05:41
description: ""
img:
tags: [spring,spring-mvc,spring-boot,spring-cloud,webapp,web,java,java-web,HandlerMethodArgumentResolver]
---

## HandlerMethodArgumentResolver 接口

`HandlerMethodArgumentResolver` 接口看起来很陌生，实际上在SpringMVC中很多地方我们都会直接或者间接的接触到

例如:

- `@RequestParam` 解析 `RequestParamMethodArgumentResolver` (基础类型的默认解析器)
- `@PathVariable` 解析 `PathVariableMethodArgumentResolver`
- `@RequestBody` 解析 `RequestResponseBodyMethodProcessor`
- `@CookieValue` 解析 `ServletCookieValueMethodArgumentResolver`
...

通过查看SpringMVC的源码， 可以看到以下代码片段，这就是SpringMVC初始化时，默认的所有HandlerMethodArgumentResolver实现
``` java
// org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter
private List<HandlerMethodArgumentResolver> getDefaultArgumentResolvers() {
    List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>();

    // Annotation-based argument resolution
    resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), false));
    resolvers.add(new RequestParamMapMethodArgumentResolver());
    resolvers.add(new PathVariableMethodArgumentResolver());
    resolvers.add(new PathVariableMapMethodArgumentResolver());
    resolvers.add(new MatrixVariableMethodArgumentResolver());
    resolvers.add(new MatrixVariableMapMethodArgumentResolver());
    resolvers.add(new ServletModelAttributeMethodProcessor(false));
    resolvers.add(new RequestResponseBodyMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
    resolvers.add(new RequestPartMethodArgumentResolver(getMessageConverters(), this.requestResponseBodyAdvice));
    resolvers.add(new RequestHeaderMethodArgumentResolver(getBeanFactory()));
    resolvers.add(new RequestHeaderMapMethodArgumentResolver());
    resolvers.add(new ServletCookieValueMethodArgumentResolver(getBeanFactory()));
    resolvers.add(new ExpressionValueMethodArgumentResolver(getBeanFactory()));
    resolvers.add(new SessionAttributeMethodArgumentResolver());
    resolvers.add(new RequestAttributeMethodArgumentResolver());

    // Type-based argument resolution
    resolvers.add(new ServletRequestMethodArgumentResolver());
    resolvers.add(new ServletResponseMethodArgumentResolver());
    resolvers.add(new HttpEntityMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
    resolvers.add(new RedirectAttributesMethodArgumentResolver());
    resolvers.add(new ModelMethodProcessor());
    resolvers.add(new MapMethodProcessor());
    resolvers.add(new ErrorsMethodArgumentResolver());
    resolvers.add(new SessionStatusMethodArgumentResolver());
    resolvers.add(new UriComponentsBuilderMethodArgumentResolver());

    // Custom arguments
    if (getCustomArgumentResolvers() != null) {
        resolvers.addAll(getCustomArgumentResolvers());
    }

    // Catch-all
    resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), true));
    resolvers.add(new ServletModelAttributeMethodProcessor(true));

    return resolvers;
}
```

`HandlerMethodArgumentResolver` 接口就两个方法，一个用来判断是否支持参数类型，一个是解析的具体实现

```java
public interface HandlerMethodArgumentResolver {

    // 返回是否支持该参数
	boolean supportsParameter(MethodParameter parameter);

    // 返回解析后的参数值
	@Nullable
	Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception;

}
```

## 使用场景

这个接口主要的使用场景就是来实现自定义的参数注入。例如在很多前后端分离的项目中，我们不会去使用Session，而是自己维护一个token来实现状态管理，

这种时候，如果需要取得用户数据，正常操作，我们可能需要手动去取得token，然后去查询用户数据

例如以下这个例子，我们从Header中取得token数据，然后从Redis中查询到用户标识，接着从数据库查询到用户基本信息

```java
@PostMapping("get-user-info")
public UserInfo getUserInfo(@RequestHeader String token) {
    // 伪代码
    Long userId = redisClient.get(token);
    UserInfo useInfo = userDao.getById(userId);
    return userInfo;
}
```

这样写没什么问题，不过在实际的项目中，我们可能很多地方都需要用到用户的一些基本信息，每次都这样去手动编码去取，就显得得很繁琐了

我们使用`HandlerMethodArgumentResolver`接口来实现

```java
// 1. 实现HandlerMethodArgumentResolver接口
public class UserInfoArgumentResolver implements HandlerMethodArgumentResolver{
    private final RedisClient redisClient;
    private final UserDao userDao;
    public UserInfoArgumentResolver(RedisClient redisClient, UserDao userDao) {
        this.redisClient = redisClient;
        this.userDao = userDao;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return UserInfo.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
        HttpServletRequest nativeRequest = (HttpServletRequest) webRequest.getNativeRequest();
        String token = nativeRequest.getHeader("token");
        Long userId = redisClient.get(token);
        UserInfo useInfo = userDao.getById(userId);
        return userInfo;
    }
}

// 2. 添加到配置中
@Configuration
@EnableWebMvc
public class FastMvcConfiguration implements WebMvcConfigurer {
    @Autowrite
    UserDao userDao;
    @Autowrite
    RedisClient redisClient;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new UserInfoArgumentResolver(redisClient, userDao));
    }
}

// 3. 在Controller中使用
@RestController
public class UserInfoController {
    @PostMapping("get-user-info")
    public UserInfo getUserInfo(UserInfo userInfo) {
        return userInfo;
    }

    @PostMapping("say-hello")
    public String sayHello(UserInfo userInfo) {
        return "hello " + userInfo.getNickName();
    }
}
```

添加了 `UserInfoArgumentResolver` 解释器以后，当我们需要使用`UserInfo`时，只需要使用指定的类型就可以取得，不需要做其他任何操作

我在项目中使用这个接口主要用来获取用户信息和对外接口的通用签名校验。 这个接口比较基础，也很通用。 在项目中用得好可以减少很多的工作量。