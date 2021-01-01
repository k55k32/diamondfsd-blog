---
layout: post 
title: React Hook入门教程 
date: 2021-01-01 01:01:01
description: "ReactHook详解，Hooks是React16.8的一个新特性，这让我们在不创建class的情况下，能够使用React的一些常用功能，例如state,生命周期等"
img: react-hooks.png
tags: [react,hook,自定义hook,useState,useEffect,hook教程,react hook教程,what's hook]
---

## 什么是hooks

Hooks是React16.8的一个新特性，这让我们在不创建class的情况下，能够使用React的一些常用功能，例如state,生命周期等。在老版本中，如果我们需要使用state,必须要声明一个class

## 为什么要有Hooks

在有Hooks之前，React有哪些问题？

- 在多层组件中共享状态逻辑很麻烦，需要通过各种方式进行组件的封装，涉及到某些历史组件时，还有可能需要进行重构
- 复杂的组件，随着生命周期的各项方法处理，变得更加复杂和难以理解。
- class的学习成本高

Hooks的出现解决了这些问题，hook使用在函数内。在Hook的使用环境下，React组件更加趋向于使用函数式组件。Hooks在函数内，不会影响React的大部分功能，但是能够更好的解决以上几个问题。
而且通过函数式方式，减少了学习成本，能够让新手更加快速的上手开发。

## React内置Hooks概览

### useState

`useState`是React提供的一个Hook。可以在函数式组件中，使用该方法维护一个组件内的局部状态。React在每次渲染该组件时，保存此状态。

和`class`组件的不同的是，`class`组件内的`state`必须是对象，而且调用`setState`方法是，会将新传入的对象和老的对象进行合并操作。
`useState`中，可以定义任何类型的局部状态，而且进行状态更新时，也不会将旧状态和新状态进行合并。

`useState(0)`的返回值是一个长度为2的数组`[count, setCount] = [当前状态值, 更新状态值的方法]`。可以通过调用 `setCount`更新状态值。

```tsx
// 函数值组件
function Example() {
    const [count, setCount] = useState(0)
    return (<div>
        <p>You clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>
            Click me
        </button>
    </div>)
}
```

```tsx
// class 组件
class Example extends React.Component {
    constructor(props) {
        super(props);
        this.state = {count: 0}
    }

    render() {
        return (<div>
            <p>You clicked {this.state.count} times</p>
            <button onClick={() => {
                this.setState({count: this.state.count + 1})
            }}>
                Click me
            </button>
        </div>);
    }
}
```

自此可以看出，在函数式+hook的情况下，代码量和代码可读性更优于class组件

而且，我们可以在一个组件中，使用使用多个`useState`

```tsx
function ExampleWithManyStates() {
    // 定义多个state
    const [age, setAge] = useState(42);
    const [fruit, setFruit] = useState('banana');
    const [todos, setTodos] = useState([{text: 'Learn Hooks'}]);
    // ...
}
```

### useEffect

`useEffect`让函数式组件拥有了类似class组件执行生命周期钩子的方法。 和`componentDidMount,componentDidUpdate,componentWillUnmount`
的作用相同，但是将这些方法统一到一个API中

`useEffect`方法可以接收两个参数，`useEffect(effectFunction: Function,dependency?: any[])`有以下几种形态

- `useEffect(function)`  在`componentDidMount`和每次`componentDidUpdate`时调用`function`
- `useEffect(function, [])` 在`componentDidMount`是调用`function`
- `useEffect(function, [arg1, arg2, ...argN])` 在`componentDidMount`调用，并且当数组中有任意值改变时，调用`function`

```tsx
import React, {useState, useEffect} from 'react';

function Example() {
    const [count, setCount] = useState(0);

    // 类似于在`componentDidMount,componentDidUpdate`调用方法
    useEffect(() => {
        // Update the document title using the browser API
        document.title = `You clicked ${count} times`;
    });

    // 类似于在`componentDidMount`调用方法
    useEffect(() => {
        console.log('component mount default count: ', count)
    }, [])

    // 类似于在`componentDidMount`调用方法，并且当count值改变时，调用方法  
    useEffect(() => {
        console.log('component mount or count update')
    }, [count])
    return (
        <div>
            <p>You clicked {count} times</p>
            <button onClick={() => setCount(count + 1)}>
                Click me
            </button>
        </div>
    );
}
```

当我们需要做某些副作用清理时，例如组件挂载时，启动一个定时器，并且在组件卸载时，清除定时器

在class组件中

```tsx
class TimerUpComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {intervalTimer: null, timerCount: 0};
    }

    componentDidMount() {
        const timer = setInterval(() => {
            this.setState({timerCount: this.state.timerCount + 1})
        }, 1000)
        this.setState({intervalTimer: timer})
    }

    componentWillUnmount() {
        clearInterval(this.state.intervalTimer)
    }

    render() {
        return (<div>current time: {this.state.timerCount}</div>)
    }
}
```

使用 `useEffect` hook

```tsx
function TimerUpComponent() {
    const [timerCount, setTimerCount] = useState(0)
    useEffect(() => {
        const timer = setInterval(() => {
            setTimerCount(timerCount + 1)
        }, 1000)
        return () => {
            clearInterval(timer)
        }
    }, [])
    return (<div>current time: {timerCount}</div>)

}
```

`useEffect`第一个参数为一个函数，该函数的返回值在组件卸载的时候会被调用，我们可以在其中清理一些定时任务，订阅，中断数据读取等操作

## Hooks使用的一些规则

虽然Hooks只是Javascript的方法，但是在使用时，需要遵守以下两条规则

### 1. 只在顶层调用

不要在循环，条件，或者嵌套函数中调用Hooks。只在React函数组件的顶层使用Hook。这样可以确保每次组件都会以相同的顺序调用Hooks，这是保证一个函数式组件中`useState`和`useEffect`状态正确的基本前提。

### 2. 只在函数式组件内调用

普通的Javascript方法内，不要调用Hooks，只在以下两种情况内调用Hooks
[x] React的函数式组件内调用Hooks，
[x] 自定义Hook中调用其他Hooks 这样你可以确保组件中所有的状态逻辑，都能够在代码中清晰可见，提升代码可读性

## 自定义Hook

自定义Hook可以将组件的状态逻辑抽离出来，方便进行复用。例如我们刚刚例子中的`TimerUpComponent`组件的作用是每秒钟进行一次`timerCount + 1`操作。 我们可以抽离出一个自定义组件

```tsx
// 定义自定义hook,useTimerUp
function useTimerUp() {
    const [timerCount, setTimerCount] = useState(0)
    useEffect(() => {
        const timer = setInterval(() => {
            setTimerCount(timerCount + 1)
        }, 1000)
        return () => {
            clearInterval(timer)
        }
    }, [])
    return timerCount
}

// 使用自定义hook
function NewTimerUpComponent() {
    const timeCount = useTimerUp()
    return (
        <div>newCurrentTimeCount : {timeCount} </div>
    )
}
```

## 总结
以上，讲解了React中最常用的hook，`useState`和`useEffect`。通过这两个基础hook，我们可以衍生出很多自定义hook。显而易见，有了hook特性，
让我们在编码过程中，能够更好组织代码结构，复用代码逻辑，使我们搬砖之路越来越顺畅。
