require('./stub') //stub out amqplib
var test = require('tape-catch')
var winston = require('winston')
winston.level = "none"

var smq = require('../index.js')

test('Ensure broadcasts are handled properly',function(t) {
  var obj1 = { foo: "bar", i:1 }
  t.plan(2)
  smq.connect(function(e) {
    t.false(e) //formallity, will be stubbed
    smq.consume("helloworld",function(obj2,cb) {
      t.deepEqual(obj1,obj2,"Ensure object passed in came back out")
      cb()
    })
    smq.broadcast("helloworld",obj1)
  })
})
