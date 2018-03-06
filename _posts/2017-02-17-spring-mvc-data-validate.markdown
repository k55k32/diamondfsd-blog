---
layout: post
title: Spring MVC 通过切面，实现超灵活的注解式数据校验
date: 2017-02-17 09:10:18 +0800
description: "这篇文在主要是介绍，如何在 Controller 的方法里面，让校验注解 ( @NotNull @Email @Size...等)，对基本类型的数据生效（基本类型 Integer,String,Long等）。  Spring MVC 有什么校验方式？  大家都知道，Spring MVC 默认依赖了 hibernate-validator 校验框架。使用这个，我们可以在可以在model的字段上，加相应的校验注解来轻松的实现数据校验。 例如:  // 实体类 public class User {   @NotNull   private String username;      @NotBla"
img:
tags: [spring aop,spring mvc,hibernate-validator,spring mvc 方法数据校验]
---

这篇文在主要是介绍，如何在 Controller 的方法里面，让校验注解 ( `@NotNull @Email @Size...等`)，对基本类型的数据生效（基本类型 `Integer,String,Long等`）。

## Spring MVC 有什么校验方式？
大家都知道，Spring MVC 默认依赖了 `hibernate-validator` 校验框架。使用这个，我们可以在可以在model的字段上，加相应的校验注解来轻松的实现数据校验。
例如:
```java
// 实体类
public class User {
  @NotNull
  private String username;

  @NotBlank
  @Length(min = 6, max = 32)
  private String password;

}

// Controller 请求
@RequestMapping("save-user")
 // 使用 @Valid 注解，告诉 Spring MVC 要校验 user 对象的数据
public User save(@Valid User user){
.....
}
```
相信大家都有接触过，使用这种方法来实现整体对象的校验，而且还可以根据不同场景，加上不同的 `@Group` 注解，来实现不同请求对数据的校验规则。

## 我们想实现什么？
但是有些时候，我们的请求参数并不多，可能只是一些零碎的基本类型的参数 例如 `String` `Integer` `Long` 等等。就像下面这个请求:
```
@RequestMapping("update-user-status")
public User update(String userId, Integer status){
....
}
```
这种情况相信大家经常遇到，大部分情况下，我们都需要对接收过来的数据做校验。 如果接收过来的是基本类型，我们一般都是包装一些工具类，然后通过编码的方式来实现校验。如果这个时候，我们想用 `@NotNull, @Email,@Size` 等校验注解，直接加在参数上，是做不到的。
例如这样，spring mvc 是不支持的。
```
@RequestMapping("update-user-status")
public User update(
              @NotNull String userId,
              @NotNull @Range(min = 0, max = 5) Integer status){
....
}
```
那么这篇文章主要就是讲解，如何让加在基本类型上的校验注解生效，最终实现上代码所呈现的效果，在基本类型参数上校验注解，执行校验逻辑。

## [Hibernate-Validator](http://hibernate.org/validator/) 方法参数校验说明
因为Spring MVC 默认使用的是 Hibernate-Validator 来进行数据校验，那么我首先瞄准的目标也就是看看 Hibernate-Validator 有没有什么方法可以直接对方法的参数进行校验。
最终我在[官方文档](http://docs.jboss.org/hibernate/stable/validator/reference/en-US/html_single/#section-validating-executable-constraints)里找到，ExecutableValidator这个接口里有一个 `validateParameters`，实现我们想要的功能，该方法声明如下:
```java
interface ExecutableValidator{
//...
 <T> Set<ConstraintViolation<T>> validateParameters(
                              T object, // 需要校验的方法所属对象
                              Method method,  // 需要校验的方法
                              Object[] parameterValues, // 需要交验的方法对应的参数
                              Class<?>... groups);  // 校验组（这里我们暂时用不到）
//...
}
```
如何使用呢？ 我写了一个测试类来测试这个方法具体返回的内容。
```java
package diamond.cms.server.mvc.valid;

import java.lang.reflect.Method;
import java.util.Set;

import javax.validation.ConstraintViolation;
import javax.validation.Validation;
import javax.validation.ValidatorFactory;
import javax.validation.constraints.NotNull;
import javax.validation.executable.ExecutableValidator;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.Range;
import org.junit.Test;

public class ExecutableValidatorTest {

    @Test
    public void hibernateVaildTest() throws NoSuchMethodException, SecurityException {
        // 需要校验的方法实例
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        ExecutableValidator validator = factory.getValidator().forExecutables();

        Method method = this.getClass().getMethod("vaildMethod",  Integer.class, String.class, String.class);
        // 校验参数，应该是有两个非法的参数
        Object [] params = new Object[]{100, "", "test"};

        // 获得校验结果 Set 集合，有多少个字段校验错误 Set 的大小就是多少
        Set<ConstraintViolation<ExecutableValidatorTest>> constraintViolationSet =
                validator.validateParameters(this, method, params);

        System.out.println("非法参数校验结果条数: " + constraintViolationSet.size());
        constraintViolationSet.forEach(cons -> {
            System.out.println("非法消息: " + cons.getMessage());
        });

        params = new Object[]{10, "build-test", "test"};
        constraintViolationSet =
                validator.validateParameters(this, method, params);

        System.out.println("合法参数校验结果条数: " + constraintViolationSet.size());
    }

    // 校验示范方法
    public void vaildMethod(@NotNull @Range(min = 0, max = 18)Integer age,@NotBlank String build, String test){}
}

```
上面的方法最终输出:
```string
非法参数校验结果条数: 2
非法消息: 需要在0和18之间
非法消息: 不能为空
合法参数校验结果条数: 0
```

## 获得校验所需参数，统一处理进行数据校验
如何去使用我们上面提到的数据校验方法呢？首先我们要想，如何去获得我们需要的参数。我们需要以下参数：
>1. 请求执行的目标对象
>2. 请求执行的方法
>3. 请求的参数

有两种方式来获得:

#### 1. 通过实现 `HandlerInterceptor` 拦截器来实现
因为通过拦截器实现，有很多坑要填，这里不推荐使用。主要讲第二个方法，通过AOP来实现校验数据获取。

### 2. 通过 AOP（切面）来实现校验数据获取
首先说，**推荐使用这种方式**，上面的那个方式在这篇文章里只是说说而已。我们来讲一讲，如何实现这样一个切面，来获取我们校验数据所需的参数。

首先定义一个切面，切入点是所有 `controllers` 包下所有类的所有方法。 最后我们定义一个方法，在切入点方法之前执行。
> 当执行到Controller这一层的时候，所有的数据已经被Spring MVC处理好了，包括数据类型的转换，自定义的`WebDataBinder`等。所以我们可以直接通过切面获得所需的校验参数，做最终校验。
```java
@Component
@Aspect
public class RequestParamValidAspect{

    Logger log = LoggerFactory.getLogger(getClass());

    @Pointcut("execution(* diamond.cms.server.mvc.controllers.*.*(..))")
    public void controllerBefore(){};

    ParameterNameDiscoverer parameterNameDiscoverer = new LocalVariableTableParameterNameDiscoverer();

    @Before("controllerBefore()")
    public void before(JoinPoint point) throws NoSuchMethodException, SecurityException, ParamValidException{
        //  获得切入目标对象
        Object target = point.getThis();
        // 获得切入方法参数
        Object [] args = point.getArgs();
        // 获得切入的方法
        Method method = ((MethodSignature)point.getSignature()).getMethod();

        // 执行校验，获得校验结果
        Set<ConstraintViolation<Object>> validResult = validMethodParams(target, method, args);

        if (!validResult.isEmpty()) {
            String [] parameterNames = parameterNameDiscoverer.getParameterNames(method); // 获得方法的参数名称
            List<FieldError> errors = validResult.stream().map(constraintViolation -> {
                PathImpl pathImpl = (PathImpl) constraintViolation.getPropertyPath();  // 获得校验的参数路径信息
                int paramIndex = pathImpl.getLeafNode().getParameterIndex(); // 获得校验的参数位置
                String paramName = parameterNames[paramIndex];  // 获得校验的参数名称
                FieldError error = new FieldError();  // 将需要的信息包装成简单的对象，方便后面处理
                error.setName(paramName);  // 参数名称（校验错误的参数名称）
                error.setMessage(constraintViolation.getMessage()); // 校验的错误信息
                return error;
            }).collect(Collectors.toList());
            throw new ParamValidException(errors);  // 我个人的处理方式，抛出异常，交给上层处理
        }
    }

    private final ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
    private final ExecutableValidator validator = factory.getValidator().forExecutables();

    private <T> Set<ConstraintViolation<T>> validMethodParams(T obj, Method method, Object [] params){
        return validator.validateParameters(obj, method, params);
    }
}
```
> FieldError.java
```java
class FieldError implements Serializable{
    private String name;
    private String message;
    // getter / setter...
}
```
> ParamValidException.java
```java
public class ParamValidException extends Exception{
    private List<FieldError>;
    public ParamValidException(List<FieldError> errors) {
        this.fieldErrors = errors;
    }
}
```

通过这样的方式，我们请求这个方法:
```
@RequestMapping(value = "token")
public Result token(@NotBlank String username, @NotBlank String password){
    String token = userService.login(username, PwdUtils.pwd(password));
    Result result = new Result(token);
    return result;
}
```
1. 模拟请求不传参数 `http://localhsot/token`
```js
{
  "success": false,
  "msg": "invalid params: [`password` 不能为空, `username` 不能为空]",
  "code": 10012,
  "data": [
    {
      "name": "password",
      "message": "不能为空"
    },
    {
      "name": "username",
      "message": "不能为空"
    }
  ]
}
```
2. 模拟请求，只传username参数 `http://localhost/token?username=testusername`
```js
{
  "success": false,
  "msg": "invalid params: [`password` 不能为空]",
  "code": 10012,
  "data": [
    {
      "name": "password",
      "message": "不能为空"
    }
  ]
}
```
3. 模拟请求，传正确参数 `http://localhost/token?username=testusername&password=testpassword`
```js
{
  "success": true,
  "code": 0,
  "data": "token-data"
}
```
以上请求结果，都是获取基本错误信息封装得来的，根据实际情况可能不同，主要是为了讲解在方法上添加 校验注解 的效果。

## FAQ （常见问题解答）
### 为什么我抛出异常后捕获不到?
> 切面内抛出的异常都会被  `UndeclaredThrowableException `包装，需要先捕获这个异常，获得这个异常后，调用这个他的 `getUndeclaredThrowable()` 方法，就可以获得实际的异常了， 例如:
```java
 @ExceptionHandler(UndeclaredThrowableException.class)
 public Result undeclaredThrowableException(UndeclaredThrowableException ex, HttpServletResponse response){
        Throwable throwable = ex.getUndeclaredThrowable(); // 获得实际异常
        if (throwable instanceof ParamValidException) { // 如果是我们自定义异常就调用自定义异常的处理方法
            return paramValidExceptionHandler((ParamValidException)throwable, response);
        }
        return exception(ex, response);
    }
```

### 为什么不实现 `HandlerInterceptor` 拦截器来处理？

实现拦截器后，拦截器提供 `preHandle` 方法，在请求处理之前执行。
```java
preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
```
这个方法传过来的最后一个参数 `Object handler` 实际上是一个 HandlerMethod 对象。
可以通过强制转换获得 ` HandlerMethod methodHandler = (HandlerMethod) handler; `

通过这个对象，我们可以获取到处理本次请求的处理对象 `HandlerMethod.getBean()`，本次请求的处理方法 `MethodHandler.getMethod()`。 至此，我们校验需要的前两个参数都有了。
问题就在这最后一个参数上，最后一个参数我们需要获得前端传过来的数据，在这里，我们只能从 `HttpServletRequest request` 里面获取。 从 `request` 获取的参数，都只是原始的 `String[]` 没有经过处理和转换。
如果要实际使用，还需要转换成 方法 对应的数据类型，并考虑自定义的 `WebDataBinder` 或其复杂类型的数据转换。 相当于要把 Spring MVC 处理参数的逻辑重新实现一遍。虽然也是可以完成的，但是太过于复杂，所以不推荐使用这种方式。

### 代码中的 LocalVariableTableParameterNameDiscoverer 是个什么东西

我们需要知道被校验的参数的名称，以便告诉前端，具体是哪个参数有问题。
通过 `LocalVariableTableParameterNameDiscoverer.getParameterNames(Method method)` 方法，获取到一个字符串数组，里面就是包含的方法的参数名称。例如如下这个方法。
```java
@RequestMapping(value = "token")
public Result token(@NotBlank String username, @NotBlank String password){
    String token = userService.login(username, PwdUtils.pwd(password));
    Result result = new Result(token);
    return result;
}

// 演示代码
LocalVariableTableParameterNameDiscoverer discoverer = new LocalVariableTableParameterNameDiscoverer();
Method method = demo.getMethod("token", String.class, String.class);
String [] paramNames = discoverer.getParameterNames(method);
// 最终获得
paramNames: ["username", "password"]
```

## 项目源码
博客系统后台源码:  [Github-cms-admin-end](https://github.com/k55k32/cms-admin-end)
文章内容的代码片段: [Github-cms-admin-end-valid](https://github.com/k55k32/cms-admin-end/tree/master/src/main/java/diamond/cms/server/mvc/valid)
个人博客: [https://diamondfsd.com](https://diamondfsd.com)

文章到此就结束了，希望对大家有所帮助，有什么问题也可以在下方进行讨论。
