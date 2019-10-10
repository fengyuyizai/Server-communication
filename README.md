### 服务器端向客户端通信

**目录 (Table of Contents)**

- 短轮询
- 长轮询
- Server Send Event(SSE)
- Websocket

####短轮询
-------------

![](https://github.com/fengyuyizai/Server-communication/blob/master/img/short.png)


####长轮询
-------------

![](https://github.com/fengyuyizai/Server-communication/blob/master/img/long.png)

####SSE
-------------

![](https://github.com/fengyuyizai/Server-communication/blob/master/img/sse.png)

####WebSocket
-------------

![](https://github.com/fengyuyizai/Server-communication/blob/master/img/websocket.png)

###代码实现

#### 文件结构

	+ server
	   + observer
			- index.js
		+ router
			- add.js
			- polling.js
			- websocket.js
		- control.js
		- index.js
	+ static
		+ css
			- index.css
		- index.html
	- app.js
	- package.json
	- start.js

#### 发布者-订阅者
功能： 用于长轮询与SSE数据更新后及时回馈给客户端
```javascript
// server/observer/index.js

function regist (type, fn, that = null) {
    const __message = this.__message
    const __thatTotal = this.__thatTotal
    if (typeof __message[type] === 'undefined') {
        __message[type] = [fn]
        __thatTotal[type] = [that]
    } else {
        __message[type].push(fn)
        __thatTotal[type].push(that)
    }
}

function fire (type, arg = {}) {
    const __message = this.__message
    const __thatTotal = this.__thatTotal
    if (!__message[type]) return

    let events = {
        type,
        arg
    }
    
    const len = __message[type].length
    for (let i = 0; i < len; i++) {
        __message[type][i].call(__thatTotal[type][i], events)
    }
}

function remove(type, fn) {
    const __message = this.__message
    const __thatTotal = this.__thatTotal
    if (__message[type] instanceof Array) {
        let i = __message[type].length - 1
        for (; i >= 0; i--) {
            if (__message[type][i] === fn) {
                __message[type].splice(i, 1)
                __thatTotal[type].splice(i, 1)
            }
        }
    }
}

const Observer = function() {
    this.__message = {}
    this.__thatTotal = {}
}

Observer.prototype = {
    // 注册监听者
    regist,
    // 发布者
    fire,
    // 移除监听者
    remove
}
```

#### 短轮询 S端
功能： 根据更新时间判定当前数据是否是最新数据
```javascript
// server/control.js

function shortPollingMsg (req, res) {
    let state = getState()
    let lastTime = req.query.updateTime
    let curTime = state.updateTime

    if (lastTime >= curTime) { // 上次更新时间与当此相同
        res.send({
            isSussess: true,
            type: 'shortPollingMsg',
            isUpdate: false,
            data: null
        })
    } else { // 获取新数据
        res.send({
            isSussess: true,
            type: 'shortPollingMsg',
            isUpdate: true,
            data: state
        })
    }
}
```

#### 长轮询 S端
功能： 接收长轮询请求，并提供心跳式请求
```javascript
// /server/control.js

function longPollingMsg (req, res) {
    let timekeeping = new Timekeeping(res)
    let waitMsg = new WaitMsg(res, 'longPollingMsg', timekeeping)
    
    // 监听最大时长内的改变
    observer.regist('longPollingMsg', waitMsg.start, waitMsg)

    // 监听最大时长外的改变
    timekeeping.start(() => {
        observer.remove('longPollingMsg', waitMsg.start)
        console.log(observer.__message)
    })
}
```
#### 建立SSE连接
```javascript
// /server/control.js

function openSSEMsg(req, res) {
    res.set("Content-Type", "text/event-stream")
    res.set("Cache-Control", "no-cache")
    res.set("Connection", "keep-alive")
    // console.log('建立连接')
    
    let waitMsg = new WaitMsg(res, 'SSEMsg')
    observer.regist('SSEMsg', waitMsg.SSEStart, waitMsg)

}
```

#### 建立WebSocket连接
```javascript
// websocket连接
function wsGetMsg (ws, req, msg) {
    // console.log(msg)
    insert(JSON.parse(msg))
    const data = {
        type: 'websocket',
        isSussess: true,
        isUpdate: true,
        data: getState()
    }
    ws.send(JSON.stringify(data))
}
```

#### 等待函数
功能：
1. 长轮询(start) :  去除注册监听 && 停止计时器 && 响应数据
2. SSE(SSEStart): 响应数据

```javascript
// /server/control.js

function WaitMsg (res, type, timekeeping) {
    this.res = res
    this.timekeeping = timekeeping || false
    this.type = type
}

WaitMsg.prototype.start = function() {
    // 停止计时器
    this.timekeeping && this.timekeeping.end()
    // 去除监听
    this.type !== 'SSEMsg' && observer.remove(this.type, this)
    this.res.send({
        type: this.type,
        isSussess: true,
        isUpdate: true,
        data: getState()
    })
}
WaitMsg.prototype.SSEStart = function() {
    const resData = {
        type: this.type,
        isSussess: true,
        isUpdate: true,
        data: getState()
    }
    // 此处要以data: 开头
    this.res.write("data: " + JSON.stringify(resData) + '\n\n')
}
```

#### 计时器
功能：最大等待时长内未改变数据，直接返回响应
```javascript
// /server/control.js

function Timekeeping (res) {
    this.res = res
    this.timer = null
}

Timekeeping.prototype = {
    start: function(fn) {
        this.timer = setTimeout(() => {
            console.log('response')
            this.res.send({
                type: 'longPollingMsg',
                isSussess: true,
                isUpdate: false,
                data: null
            })

            fn()
            this.end()
        }, maxLongPollingTime)
    },
    end: function() {
        clearTimeout(this.timer)
    }
}
```
