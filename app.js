import express from 'express'
import { router } from './server'
import bodyParser from "body-parser";

const app = express()

app.use(express.static('static'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use('/polling', router)

app.listen(3000, function() {
    console.log('listen on port 3000')
})

module.exports = app;