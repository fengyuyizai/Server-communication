import express from 'express'
import { addMsg } from "../control";
var router = express.Router()

router.post('/addMsg', addMsg)

module.exports = router