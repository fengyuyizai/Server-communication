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

/**
 * test
 */

// const observer = new Observer()

// function Test () {
// }

// Test.prototype.ttt = function (e) {
//     console.log(e.type, e.arg.msg)
// }

// let test = new Test()
// observer.regist('test', test.ttt)

// observer.fire('test', {msg: '数据'})

// observer.remove('test', test.ttt)

// console.log(observer.__message)

module.exports = {
    observer: new Observer()
}