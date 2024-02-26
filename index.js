const express = require('express');
const cors = require('cors');
const app = express()
// const http = require('http');

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.json()) //permite el paso del payload en el body

//Socket corriendo en puerto 8033  path:reportabilidad
const socket = require('./src/Socket/socket');
new socket()
//Socket

// Llamado Epp
const epp = require('./src/proyectos/aprendizaje/aprendizaje')

const port = 8060;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto: ${port}`);
});

const whiteList = ['http://appsgobm.com','http://localhost:3000'];
//app.use(cors({origin:whiteList}));
app.use(cors({origin:"*"}));

//epp
app.use('/aprendizaje',epp);

const cron = require('node-cron');
const {generaFotoStatusAdm} = require('./src/proyectos/aprendizaje/enviarStatus');
// Correo dias lunes aprendizaje '0 7 * * 1 '
cron.schedule('* 18 * 2 4 ', () => {
  console.log('envio de correo 12:00')
  generaFotoStatusAdm()
 },{
 scheduled: true,
 timezone: "America/Santiago"
 });
