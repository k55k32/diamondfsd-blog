---
layout: post
title: 写一个代码生成器的心路历程，和一个只需要一天就能完成的代码生成器maven插件源码
date: 2019-6-19 17:12:25 +0800
description: "代码生成器的原理，大体就是根据指定的模板，传入动态的参数，替换模板内容，动态生成不同的文件代码。通过maven插件的方式，可以很好的集成到我们的项目中，只需要添加插件依赖，然后添加几个配置，执行maven相关命令，就可以完成代码生成的操作。这是我在工作当中为了给组员提供更优质的开发体验，而编写的一款代码生成器。"
img:
tags: [simple-codegen,maven-plugin,maven-center-repository-upload,issues.sonatype.org,oss.sonatype.org]
---

## 为什么要写一个代码生成器
在写后端项目的时候，基础的实现功能都是增删查改，通常以表或者指定的数据模型为单位进行增删查改。  

在大部分的Web项目中，通常写一个增删查改需要新建很多个基础类。

假设你的项目是由 控制层、服务层、数据访问层组成，那么如果新增一个表的增删查改功能，我们就也许需要针对这个表创建以下这些类。
```
Model.java
ModelController.java
IModelService.java
ModelService.java
IModelDao.java
ModelDao.java
```

创建完成后，某些项目结构是有通用的基础类，可能还需要根据Model类型来添加泛型，这样又是需要一顿复制粘贴的操作。
```java 
interface IModelService extends IBaseService<Model,Long> {}
class ModelService extends BaseService<Model,Long> implements IModelService {}
interface IModelDao extends IBaseDao<Model,Long> {}
class ModelDao extends BaseDao<Model,Long> implements IModelDao {}
```

当然每个公司的项目结构都不同，以上操作可能有多有少，但是对于一个后台系统来说，大量类似的增删查改类是少不了的。
如果你的项目结构是无规律的，那么代码生成器可能不太适合你

## 代码生成器的级别
1. 复制粘贴型代码生成器   
顾名思义，最简单也是用的最多的方式，直接将现有的其他类似文件复制一份，改一改关键信息即可。成本最低，耗时根据项目需要复制的文件决定。有可能因为少改某些内容导致代码异常。

总的来说，通过复制粘贴的方式来生成代码，简单易用，无学习成本，但是比较容易出错，有一定修改成本，耗时和文件数量、修改内容成正比。

2. 框架自带代码生成器   
通常和框架绑定，对于已有的系统难以植入，局限性高。生成的代码格式较为单一，很难做灵活配置化使用。
 
3. 自定义代码生成器   
因为大部分系统的代码结构比较统一，但又有些不同，所以在市场上没有适合自己的生成器的时候，我们就会选择自己写一个，通过直接执行`main`方法来生成文件，定义几个参数，在需要生成的时候进行修改执行。

本文介绍的代码生成器主要在此基础上进行扩展，通过maven插件的方式，将需要自定义的参数通过插件配置来运行，这样一套代码多地使用，只需要添加maven依赖，不需要将生成器的代码复制多遍难以维护。

## 自定义代码生成器maven插件    
代码生成器的原理，大体就是根据指定的模板，传入动态的参数，替换模板内容，动态生成不同的文件代码。 

通过maven插件的方式，可以很好的集成到我们的项目中，只需要添加插件依赖，然后添加几个配置，执行maven相关命令，就可以完成代码生成的操作。

这是我在工作当中为了给组员提供更优质的开发体验，而编写的一款代码生成器。

- 地址: [https://github.com/k55k32/simple-codegen](https://github.com/k55k32/simple-codegen)
- `simple-codegen` 使用freemarker作为模板引擎，结合maven插件，使参数配置简单化， 并且多项目使用只需要添加插件依赖，并且修改制定参数，定制好模板，即可一键生成代码。

- 因为模板可以根据项目自定义，基本所有情况下，只需要定义好模板，配置参数，即可开始使用
- 目前的参数都算是固定参数，未来可能还将支持一些动态参数例如: 
1. 读取表结构作为参数
2. 直接调用接口, 获取返回值作为参数
3. 直接调用本地代码，获取返回值作为参数

## 代码实现细节讲解
- 代码真的很简单，目前总共就一个模板渲染的功能，大家可以自行看[源码](https://github.com/k55k32/simple-codegen)，不懂的可以提[Issue](https://github.com/k55k32/simple-codegen/issues)， 有优化可以提 [Pull Request](https://github.com/k55k32/simple-codegen)

## 上传至中央仓库教程
我真是边写教程边上传，真正的一手实操经验
### 1. 申请中央仓库账号
- 进入 [https://issues.sonatype.org](https://issues.sonatype.org)
- 点击  Sign up 创建账号 
- 新建一个问题类型为New Project的, 注意Group Id和自己项目pom.xml要一致，如果是自己的域名，需要有域名DNS管理权限，因为仓库管理员会要求你添加TXT记录指向指定地址。如果没有自己的域名，可以用自己的Github地址，管理员会要求你创建一个指定名称的仓库      

![alt]({{site.baseurl}}/assets/post-img/2019-06-19/create.png)
- 提交申请完成后，管理员就会通知你用户已经可以上传快照版本或者发布版本了     

![alt]({{site.baseurl}}/assets/post-img/2019-06-19/issue-closed.png)   

前期注册工作就完成了，接下来是上传流程，接下来流程用到的用户名密码使用刚刚创建的用户名密码

### 2. pom.xml 修改和 settings.xml 配置
- 在本地maven配置 `settings.xml` 内添加自己的账号密码(上传需要), id可以自定义。账号密码可以明文输入，也可以登陆 [https://oss.sonatype.org](https://oss.sonatype.org) 点击右上角用户名进入`Profile`, 然后选择`User Token`创建一个加密的 `Access User Token` , 可以替换 `settings.xml` 内的账号密码，这样可以避免明文保存用户名密码     

```xml
<servers>
    <server>
        <id>sonatype-center</id>
        <username>youRegisterUsername</username>
        <password>youRegisterPassword</password>
    </server>
</servers>
```

- 在 `pom.xml` 内添加远程发布仓库地址，注意id需要和 `settings-xml`配置的一致   

```xml
<distributionManagement>
    <repository>
        <id>sonatype-center</id>
        <name>releases repo</name>
        <url>https://oss.sonatype.org/service/local/staging/deploy/maven2</url>
    </repository>
    <snapshotRepository>
        <id>sonatype-center</id>
        <name>snapshots repo</name>
        <url>https://oss.sonatype.org/content/repositories/snapshots</url>
    </snapshotRepository>
</distributionManagement>
```

- `pom.xml` 文件内容如要标准化，需要添加以下标签描述，内容自定义，已添加请忽略，可参考 [pom.xml](https://github.com/k55k32/simple-codegen/blob/master/pom.xml)   

```xml
<name>simple-codegen</name>
<url>https://diamondfsd.com</url>

<description>
    simple code generate maven plugin.
    Template rendering through Java and freemarker.
</description>

<developers>
    <developer>
        <id>diamondfsd</id>
        <name>Diamond Zhou</name>
        <email>diamondfsd@gmail.com</email>
        <url>https://diamondfsd.com</url>
        <timezone>8</timezone>
    </developer>
</developers>

<licenses>
    <license>
        <name>The MIT License</name>
        <url>https://opensource.org/licenses/MIT</url>
        <distribution>repo</distribution>
    </license>
</licenses>
<scm>
    <url>
        https://github.com/k55k32/simple-codegen.git
    </url>
</scm>
```

### 3. 文件签名 （不签名无法发布）  
- [签名教程](https://central.sonatype.org/pages/working-with-pgp-signatures.html)   
- windows版本密钥生成工具下载: [https://gpg4win.org/download.html](https://gpg4win.org/download.html)  

安装完成后的名字叫: `Kleopatra` 打开后，新建一个密钥对，创建完成后。

注意如果是在IDE等环境中运行maven，安装完Kleopatra需要重启IDE，否则环境变量未生效，执行maven插件的时候，找不到 `gpg` 命令

- `pom.xml` 添加插件配置   

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-gpg-plugin</artifactId>
    <version>1.5</version>
    <executions>
        <execution>
            <id>sign-artifacts</id>
            <phase>verify</phase>
            <goals>
                <goal>sign</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### 4. 到中央仓库发布
- 执行 `mvn clean deploy` 上传到中央仓库
- 登陆 [https://oss.sonatype.org/](https://oss.sonatype.org/) 点击左侧 `Staging Repositoryies` 菜单，然后下拉到最下面，可以找到你刚刚上传的包
- 选中改包点击 `Close`
- `Close` 完成后，点击 `Release` (如果Close失败， 点击项目，可以在底部Activity内看到失败原因，根据原因自行解决)
- `Release` 完成后，你的包就进入了中央仓库同步队列了，同步完成后，其他人就可以直接在 `pom.xml` 内添加你的包依赖了，具体的同步时间，官方给出的是10分钟内会同步到中央仓库，可以引用依赖。然后2小时内同步到搜索引擎，可以在 https://search.maven.org 搜索到。