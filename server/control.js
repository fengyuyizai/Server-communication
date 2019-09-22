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
    let waitMsg = new WaitMsg(res, timekeeping)
    
    // 监听最大时长内的改变
    observer.regist('longPollingMsg', waitMsg.start)

    // 监听最大时长外的改变
    timekeeping.start(() => {
        observer.remove('longPollingMsg', waitMsg.start)
        console.log(observer.__message)
    })
}

function WaitMsg (res, timekeeping) {
    this.res = res
    this.timekeeping = timekeeping
}

WaitMsg.prototype = {
    start: function() {
        // 停止计时器
        this.timekeeping.end()
        // 去除监听
        observer.remove('longPollingMsg', this)

        this.res.send({
            type: 'longPollingMsg',
            isSussess: true,
            isUpdate: true,
            data: getState()
        })
    
        return
    }
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

module.exports = {
    getMsg,
    addMsg,
    longPollingMsg,
    shortPollingMsg
}

