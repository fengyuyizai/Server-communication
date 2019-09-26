import express from 'express'
import {
    getMsg,
    longPollingMsg,
    shortPollingMsg,
    openSSEMsg
} from "../control";

var router = express.Router()

router.get('/getMsg', getMsg)

router.get('/longPollingMsg', longPollingMsg)

router.get('/shortPollingMsg', shortPollingMsg)

router.get('/openSSEMsg', openSSEMsg)

module.exports = router