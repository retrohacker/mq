var mq = require('../index.js')

mq.connect(function(e) {
  if(e) {
    console.error(JSON.stringify(e))
    return process.exit(1)
  }
  mq.handle('get:user',function(e,id,cb) {
    console.log("HELL YES, I CAN HANDLE THIS!")
    if(e) console.log("handle:",typeof e,"e:",e)
    if(id) console.log("handle:",typeof id,"id:",id)
    cb({uid:1,fname:"William",lname:"Blankenship",email:"william.jblankenship@gmail.com"})
  })

  console.log("Service started...")

  trigger("get:user",{uid:1,email:"william.jblankenship@gmail.com"})

})

function trigger(key,value) {
  mq.trigger(key,value,function(e,user) {
    console.log("WOAH! I GOT A RESPONSE!")
    if(e) console.log("trigger:",typeof e,"e:",e)
    if(user) console.log("trigger:",typeof user,"user:",user)
    trigger(key,e)
  })
}
