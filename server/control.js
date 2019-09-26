import { observer } from './observer'

const initState = {
    data: [
        {
            id: 1,
            text: '这是消息'
        }
    ],
    updateTime: (new Date()).getTime()
}

let idNum = 1

const maxLongPollingTime = 5000 // ms

/**
 * 插入
 * @param {Object} data 
 */
function insert (data) {
    data.id = ++idNum
    initState.data.push(data)
    initState.updateTime = (new Date()).getTime()

    return initState
}

/**
 * 
 */
function getState () {
    return initState
}

function getMsg (req, res) {
    const data = getState()
    res.send(data)
}

function addMsg (req, res) {
    const body = req.body
    let isSussess = true
    if (body.text && (body.text === '' || body.text === null)) {
        isSussess = false
    }

    // 更新state
    insert({
        text: body.text
    })

    // 发布更新
    observer.fire('longPollingMsg')
    observer.fire('SSEMsg')

    res.send({
        isSussess
    })
}

/**
 * 长轮询
 * @param {*} req 
 * @param {*} res 
 */
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

/**
 * 等待函数
 * @param {Object} res 
 * @param {String} type 
 * @param {Function} timekeeping 
 */
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

/**
 * 短轮询
 * @param {*} req 
 * @param {*} res 
 */
function shortPollingMsg (req, res) {
    let state = getState()
    // console.log(req)
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

// 建立SSE连接
function openSSEMsg(req, res) {
    res.set("Content-Type", "text/event-stream")
    res.set("Cache-Control", "no-cache")
    res.set("Connection", "keep-alive")
    // console.log('建立连接')
    
    let waitMsg = new WaitMsg(res, 'SSEMsg')
    observer.regist('SSEMsg', waitMsg.SSEStart, waitMsg)

}

// websocket连接
function wsGetMsg (ws, msg) {
    console.log(msg)
    ws.send(msg)
}

module.exports = {
    getMsg,
    addMsg,
    longPollingMsg,
    shortPollingMsg,
    openSSEMsg,
    wsGetMsg
}

