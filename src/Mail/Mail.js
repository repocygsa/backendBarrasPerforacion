const nodemailer = require('nodemailer');

  class MailServer{

      constructor(){      

          this.mailer = nodemailer.createTransport({
            service:'gmail',
            auth: {
              user: 'soporteappsgom@gmail.com',
              pass: 'dbtnkchonajiqwkx',
            }


          })

      }

      enviarCorreo(verifMail, paramsTo, subject, html,attachments){
        
            const correo =  this.mailer.sendMail({
                from: '"APPSGOM" <soporteappsgom@gmail.com',
                to: verifMail,
                bcc:paramsTo,
                subject:subject,
                text:'AppsGobm',
                html:html,
                attachments:attachments
            },function(err,info){
                if (err) {
                    console.log(err)
                }else{
                    return correo;
                }
            })

      }

}

module.exports=MailServer;