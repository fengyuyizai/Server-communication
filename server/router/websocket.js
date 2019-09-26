import expressWs from 'express-ws'
import express from 'express'
import { wsGetMsg } from "../control";

const router = express.Router();
expressWs(express())

router.ws('/getMsg', function (ws, req) {
    ws.on('message', wsGetMsg.bind(this, ws))
})

module.exports = router