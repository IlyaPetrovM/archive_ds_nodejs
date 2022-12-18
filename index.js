const http = require('http')
const fs = require('fs')
const path = require('path')
const mysql = require('mariadb')
const dbConfig  = require('./config')
const chalk = require('chalk')

const PORT = 3000

const sqlPool = mysql.createPool(dbConfig)

const server = http.createServer((req, res) => {

/****************************
 * Перехватываем sql-запросы
*********************************/
    if(req.url === '/sql'){
        req.on('data', (postData) =>{ 

            // Здесь принимаем данные из POST запроса
            quer = JSON.parse(postData).data
            console.log('\nВыполняю запрос: \n\t'+ chalk.blueBright(quer))

            sqlPool.getConnection()
                .then(sqlConn => {
                    sqlConn.query(quer).then((rows) => {
                       console.log('Получено строк: ', (rows).length)
                        res.writeHead(200)
                        res.end(JSON.stringify(rows))
                    })
                })                

            
            
        })
        return
    }  

/******************************************
 * Обрабатываем открытие страниц и прочее 
 ***************************************8**/ 
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url)
    
    // Определяем расширение запрашиваемого файла
    const ext = path.extname(filePath)
    let contentType = 'text/html;charset=utf-8'
    switch(ext){ 
        case '.css':
            contentType = 'text/css'
            break
        case '.js':
            contentType = 'text/javascript'
            break   
        default:
            contentType = 'text/html;charset=utf-8'
    }
    if(!ext){
        filePath += '.html'
    }

    // Читаем и отправляем клиенту запрошеный файл
    fs.readFile(filePath, (err,data) => {
        if (!err){
            console.log( chalk.greenBright(filePath + '\t-->\tOK '))
            res.writeHead(200, {'Content-Type': contentType})
            res.end(data)
        }
        else{
            console.log( chalk.red(filePath + '\t-->\terr '))
            fs.readFile(path.join(__dirname, 'public', 'error.html'), (er, errPage)=>{
                if(!er){
                    if(ext === '.html' || !ext){
                        res.writeHead(200, {'Content-Type': 'text/html'}) 
                        res.end(errPage)
                    }else{
                        res.end(undefined)
                    }
                }else{
                    throw er
                    res.writeHead(500) 
                    res.end()
                }
            })
        }
    })

}) 

server.listen(PORT, () => {
    console.log('\n\nСервер стартовал на порту: ', PORT)
})
server.on('data', (d) =>{
    console.log('data: '+d)
})


