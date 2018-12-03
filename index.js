const express = require('express')
const puppeteer = require('puppeteer')
// const sleep = require('sleep')
const bodyParser = require('body-parser')
const ip = require('ip').address()
const port = 3002
const app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

app.use('/case', express.static('case'));

app.use('/check', function (req, res) {
    if (!req.body || !req.body.url) {
        res.send({
            success: false,
            description: 'url 不能为空'
        })
        return
    }
    (async() => {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox']
            // headless: false,//不使用无头chrome模式
            // executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',//path to your chrome
        })
        const page = await browser.newPage()
        await page.goto('https://baidu.com')
        await page.goto(req.body.url)
        await page.goBack()
        const currentUrl = await page.url();
        if (currentUrl.indexOf('baidu.com') === -1) {
            const key = req.body.url.replace(/[\/\.]/g, '-')
            await page.screenshot({path: `case/${key}.png`})
            res.send({
                success: false,
                data: `http://${ip}:${port}/case/${key}.png`
            })
        } else {
            res.send({
                success: true
            })
        }
        await browser.close()
    })();
})

/**
 * check 是否有吸顶或吸底
 */
app.use('/geLpType', function (req, res) {
    if (!req.body || !req.body.url) {
        res.send({
            success: false,
            description: 'url 不能为空'
        })
        return
    }
    (async() => {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',//path to your chrome
        })
        const page = await browser.newPage()
        await page.goto(req.body.url)
        const resultHandle = await page.evaluateHandle(() => {
            const type = {}
            const document = window.document
            const elems = document.body.getElementsByTagName("*");
            const len = elems.length;
            for (let i = 0; i < len; i++) {
                let el = elems[i]
                if (el.style.position === 'fixed'
                    || window.getComputedStyle(el, null).getPropertyValue('position') === 'fixed') {
                    if (el.offsetTop === 0) {
                        type.top = 0
                    } else if (document.body.clientHeight - el.offsetTop === el.clientHeight) {
                        type.bottom = 0
                    }
                }
            }
            return type
        });
        const data = await resultHandle.jsonValue();
        await resultHandle.dispose();
        res.send({
            success: true,
            data
        })
        await browser.close()
    })();
})

app.listen(port, function () {
    console.log('Example app listening on port 3002!')
})
