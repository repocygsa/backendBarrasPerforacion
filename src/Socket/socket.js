const socketio  = require('socket.io');
const conector = require('../conectorMysql/conectorMysql');
const jwt = require('jsonwebtoken');
const moment = require("moment");

class Socket{
    constructor(){
       
        this.io = socketio(8034,{
            path: "/epp",
            cors:{
                origin:'*',
                methods:['GET','POST']
               }    
        });
         this.socketEvents()  
    }

    socketEvents(){
       
        this.io.on('connection',(socket)=>{    
           // *************** PROYECTO REPORTABILIDAD GOBM *****************
                  socket.on('eppReserva',()=>{                 
                    this.io.emit('resSocketReserva')                    
                  })    
                  
                  socket.on('eppStock',()=>{                 
                    this.io.emit('resSocketStock')                    
                  })   
                                 
            // *************** FIN PROYECTO REPORTABILIDAD GOBM *****************

        }) // cierra connection      
    }

}
module.exports=Socket;