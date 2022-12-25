const http = require('http')
const fs = require('fs')
const path = require('path')
const mysql = require('mariadb')
const dbConfig  = require('./config')
const chalk = require('chalk')
const url = require('url')

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

    /********************************************************
     * Обработка входа пользователя под логином и паролем
     ********************************************************/
    if(req.url === '/do_login'){
        req.on('data', (postData) =>{ 

            // Принимаем данные из POST запроса
            const { username, password} = url.parse('/?'+postData,true).query // Парсим POST запрос формата host/?query1=val&query2=val...
            console.log('\npostData: \n\t', { username, password} )

            query = `SELECT pass,email FROM users WHERE email like ${username} LIMIT 1;`
            sqlPool.getConnection()
                .then(sqlConn => {
                    sqlConn.query(query).then((rows) => {
                       console.log('Получено строк: ', (rows).length)
                            if ((rows).length>0){
                                res.writeHead(307,{
                                    'Location': '/', 
                                    'Set-Cookie':[`user=${username}; Same-Site:Strict; Max-Age:5`]
                                })
                                res.end()
                            }else{
                                console.log('Пользователь не найден')
                            }
                        
                    }).catch((err)=>{
                        console.log('Ошибка!', err) // TODO создать таблицу users
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

            if (!req.headers.cookie){
                console.log('Куки пусты => Необходимо авторизовать пользователя!')
                // Возвращаем страницу входа
                fs.readFile(__dirname+'/public/login.html', (err,data) =>{
                    if(!err){
                        res.writeHead(200,{'Content-Type': contentType})
                        res.end(data)
                    }else{
                        res.writeHead(500) 
                        res.end()
                    }
                })
            }else{
                res.writeHead(200, {
                    'Content-Type': contentType
                })
                res.end(data)
            }
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


