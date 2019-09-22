import express from 'express'
import {
    addMsg,
    getMsg,
    longPollingMsg,
    shortPollingMsg
} from "./control";

var router = express.Router()

router.get('/getMsg', getMsg)

router.post('/addMsg', addMsg)

router.get('/longPollingMsg', longPollingMsg)

router.get('/shortPollingMsg', shortPollingMsg)

module.exports = router