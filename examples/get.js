var mq = require('../index.js')

mq.connect(function(e) {
  if(e) {
    console.error(JSON.stringify(e))
    return process.exit(1)
  }
  console.log("Service started...")
  mq.trigger('get:user(id)',1,function(e,user) {
    console.log("WOAH! I GOT A RESPONSE!")
    if(e) console.log(JSON.stringify(e))
    if(user) console.log(user)
  })
  mq.handle('get:user(id)',function(e,id,cb) {
    console.log("HELL YES, I CAN HANDLE THIS!")
    if(e) console.log(JSON.stringify(e))
    if(id) console.log(id)
    cb({uid:1,fname:"William",lname:"Blankenship",email:"william.jblankenship@gmail.com"})
  })
})
