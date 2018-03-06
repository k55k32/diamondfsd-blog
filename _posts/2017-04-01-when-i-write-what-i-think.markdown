---
layout: post
title: 当我在写一个评论通知功能的时候， 我在想些什么？
date: 2017-04-01 17:28:17 +0800
description: "最近忙完了公司的事情，在空闲时间，来更新一下自己的博客了。现在博客在我个人博客在自己的努力推广下，终于有了一些访问量（屈指可数），有一些朋友会回复一些文章进行询问和探讨。 由于没什么时间，一直没有完善评论功能，还必须每次登陆后台才能知道有没有新用户的评论。 大部分时间都不能及时回复，回复的话，用户如果不来浏览你的网页，他也不知道，所以就想做一个邮件提醒，告诉用户，有人回复你的评论了，快来我博客看看。  需求分析  总结起来就两个功能 用户评论后，发送邮件通知博主 博主在后台可以回复对应的评论，并且如果评论人填了邮箱，发送通知到评论人 我们来细分一下这两个功能，以及讲一下具体的实现。大家可以想一"
img:
tags: [spring aop,架构]
---

最近忙完了公司的事情，在空闲时间，来更新一下自己的博客了。现在博客在我个人博客在自己的努力推广下，终于有了一些访问量（屈指可数），有一些朋友会回复一些文章进行询问和探讨。
由于没什么时间，一直没有完善评论功能，还必须每次登陆后台才能知道有没有新用户的评论。 大部分时间都不能及时回复，回复的话，用户如果不来浏览你的网页，他也不知道，所以就想做一个邮件提醒，告诉用户，有人回复你的评论了，**快来我博客看看**。

## 需求分析
- 总结起来就两个功能
> 1. 用户评论后，发送邮件通知博主
> 2. 博主在后台可以回复对应的评论，并且如果评论人填了邮箱，发送通知到评论人

我们来细分一下这两个功能，以及讲一下具体的实现。大家可以想一想，如果是你，你会如何去实现这一简单的功能，有不同的意见，欢迎大家进行交流和探讨。

### 表修改
1. 新增两个字段， `reply_id` 和 `from_author`
`reply_id` 用于记录是回复的哪个评论，
`from_author` 作为boolean类型，用于表示是否是博主做出的评论。（用于以后前端加特效，duan duan duan~）
```sql
CREATE TABLE `c_comment` (
  `id` varchar(40) NOT NULL,
  `article_id` varchar(40) NOT NULL,
  `nickname` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `content` varchar(512) DEFAULT NULL,
  `state` int(11) NOT NULL DEFAULT '1' COMMENT '0: 删除\n1: 正常\n',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(40) NOT NULL,
  `reply_id` varchar(40) DEFAULT NULL,
  `from_author` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`),
  KEY `fk_c_comment_c_article1_idx` (`article_id`),
  KEY `fk_c_comment_c_comment1_idx` (`reply_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

### 邮件发送构思
1. 基础邮件发送模块
2. 使用模板来发送邮件，邮件是支持 html 格式的，虽然每个邮件服务商支持的标准不同，但是使用模板还是可以一定程度的美化邮件内容，让用户拥有更好的体验。
3. 发送邮件作为一个提醒服务，大部分情况下不需要同步。发送邮件需要占用一定的时间，而且服务器的网络情况和邮件服务商的服务器不能确定，有一定几率发送失败，这个时候需要保证正常的业务逻辑不受影响。

### 新增接口
1. 新增回复接口，博主在后台进行回复操作的时候调用，参数为 回复内容以及被回复的评论id
2. 修改原有前端调用的评论接口，将`from_author`设置为`false`

## 渲染模板
写了，TemplateRenderUtil工具类，提供 `render`方法，基础的是`render(String temp, Map<String,String>) `这个方法，其他所有方法都是对这个方法的重载。
```java
Map<String,String> tempData = new HashMap<>();
tempData.put("nickname", "testnickname");
String renderResult = TemplateRenderUtil.render("<p> nickname: {{nickname}}</p>", tempData);
System.out.println(renderResult);
// 输出 <p> nickname: testnickname</p>
```
```java
package diamond.cms.server.utils;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TemplateRenderUtil {


    public static String renderResource(String resourcePath, Object value) throws IOException {
        InputStream input = TemplateRenderUtil.class.getResourceAsStream(resourcePath);
        return render(input, value);
    }

    /**
     * @see diamond.cms.server.utils.TemplateRenderUtil#render(String, Map)
     * @param file
     * @param value
     * @return
     * @throws IOException
     */
    public static String render(File file, Object value) throws IOException {
        return render(new FileInputStream(file), value);
    }

    /**
     * @see diamond.cms.server.utils.TemplateRenderUtil#render(String, Map)
     * @param in
     * @param value
     * @return
     * @throws IOException
     */
    public static String render(InputStream in, Object value) throws IOException {
        BufferedReader re = new BufferedReader(new InputStreamReader(in));
        String line = null;
        StringBuffer fileContent = new StringBuffer();
        while((line = re.readLine()) != null) {
            fileContent.append(line);
        }
        re.close();
        return render(fileContent.toString(), value);
    }

    /**
     * @see diamond.cms.server.utils.TemplateRenderUtil#render(String, Map)
     * @param temp
     * @param value
     * @return
     */
    public static String render(String temp, Object value) {
        if (value instanceof Map) {
            Map<?,?> map = (Map<?, ?>) value;
            Map<String,String> stringMap = new HashMap<>();
            map.entrySet().forEach(entry -> {
                String key = entry.getKey() == null ? null : entry.getKey().toString();
                String mapValue = entry.getValue() == null ? null : entry.getValue().toString();
                stringMap.put(key, mapValue);
            });
            return render(temp, stringMap);
        }
        Map<String, String> map = new HashMap<>();
                Arrays.asList(value.getClass().getMethods()).stream().filter(m -> {
            return m.getName().startsWith("get") && m.getParameterCount() == 0;
        }).forEach(method -> {
            String name = method.getName().substring(3);
            String fieldName = name.substring(0, 1).toLowerCase() + name.substring(1);
            String stringResult = null;
            try {
                Object result = method.invoke(value);
                stringResult = (result == null ? null : result.toString());
            } catch (Exception e) {
            }
            map.put(fieldName, stringResult);
        });
        return render(temp, map);
    }

    /**
     * render template string
     * @param temp like "my name is {{name}}"
     * @param data <Map> {"name": "diamond"}
     * @return "my name is diamond
     */
    public static String render(String temp, Map<String, String> data) {
        Pattern pattern = Pattern.compile("\\{\\{[\\w]{0,}\\}\\}");
        Matcher m = pattern.matcher(temp);
        while (m.find()) {
            String mp = m.group();
            String key = mp.substring(2).substring(0, mp.length() - 4);
            String value = data.get(key);
            temp = temp.replace(mp, value == null ? "" : value);
        }
        return temp;
    }
}
```

## 邮件通知切面
根据两个接口方法做不同切点，异步执行模板渲染，发送邮件等逻辑。
普通用户评论，发送邮件通知管理员，使用通知管理员模板。
管理员回复用户，如果评论者有邮箱，发送邮件通知用户，使用通知用户模板。
异步就直接用 java8 的 `CompletableFuture.runAsync` 来完成，简单粗暴。
避免不可预知情况，捕获了异常并且输出到错误日志里面去，方便排查。
```java
package diamond.cms.server.mvc.aspect;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

import javax.annotation.Resource;

import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import diamond.cms.server.model.Comment;
import diamond.cms.server.model.User;
import diamond.cms.server.services.ArticleService;
import diamond.cms.server.services.CommentService;
import diamond.cms.server.services.EmailSendService;
import diamond.cms.server.services.UserService;
import diamond.cms.server.utils.TemplateRenderUtil;
import diamond.cms.server.utils.ValidateUtils;

@Component
@Aspect
public class CommentEmailNoticeAspect{

    public static String COMMENT_NOTICE_TEMP = "/email-template/CommentNoticeTemplate.html";
    public static String REPLY_NOTICE_TEMP =  "/email-template/ReplyCommentNoticeTemplate.html";

    @Resource
    UserService userService;
    @Resource
    EmailSendService emailSendService;
    @Resource
    ArticleService articleService;
    @Resource
    CommentService commentService;

    Logger log = LoggerFactory.getLogger(getClass());

    @AfterReturning(returning="comment", pointcut="execution(* diamond.cms.server.mvc.controllers.CommentController.saveComment(..))")
    public void after(Comment comment) {
        CompletableFuture.runAsync(new Runnable() {
            @Override
            public void run() {
                try {
                    User admin = userService.findAdmin();
                    if (admin != null) {
                        String artTitle = articleService.getTitle(comment.getArticleId());
                        comment.setArticleTitle(artTitle);
                        try {
                            String emailContent = TemplateRenderUtil.renderResource(COMMENT_NOTICE_TEMP, comment);
                            emailSendService.sendEmail(admin.getUsername(), "Blog Comment Notice", emailContent, "comment-notice-" + comment.getId());
                        } catch (IOException e) {
                            log.error("template render error, send email after comment faild", e);
                        }
                    }
                } catch(Exception e) {
                    log.error("send comment notice email faild", e);
                }
            }
        });
    }

    @AfterReturning(returning="comment", pointcut="execution(* diamond.cms.server.mvc.controllers.CommentController.replyComment(..))")
    public void afterReply(Comment comment) {
        CompletableFuture.runAsync(new Runnable() {
            @Override
            public void run() {
                try {
                    Comment byReplyComment = commentService.get(comment.getReplyId());
                    String toEmail = byReplyComment.getEmail();
                    if (ValidateUtils.isEmail(toEmail)) {
                        String articleTitle = articleService.getTitle(comment.getArticleId());
                        comment.setArticleTitle(articleTitle);
                        try {
                            String emailContent = TemplateRenderUtil.renderResource(REPLY_NOTICE_TEMP, comment);
                            emailSendService.sendEmail(toEmail, "Comment Reply Notice", emailContent, "comment-reply-" + comment.getId());
                        } catch (IOException e) {
                            log.error("template render error, send email reply comment faild", e);
                        }
                    }
                } catch (Exception e) {
                    log.error("send comment reply email faild", e);
                }
            }
        });
    }
}
```


## 总结
每个人实现功能的想法都大不相同，希望我的这篇文章可以在你的工作，学习中带来一定的帮助。更多的源码细节可以看本博客的源码
后台接口源码:  [github-cms-admin-end](https://github.com/k55k32/cms-admin-end)
因为使用的是前后端分离的架构，所以这个项目是可以独立跑起来的，并且有相应的单元测试，可以进行一些接口的调试和验证功能完整性。
博客系统没有那么多复杂的功能，整体架构较为简单。对整个项目的分包比较细，想着以后功能越来越多的时候，可以方便的拆分，服务化等。


