import express from 'express'
import { polling, add, webSocket } from './server'
import bodyParser from "body-parser";
import expressWs from "express-ws"

const app = express()

expressWs(app);

app.use(express.static('static'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use('/polling', polling)
app.use('/ws', webSocket)
app.use('/', add)

app.listen(3000, function() {
    console.log('listen on port 3000')
})

module.exports = app;