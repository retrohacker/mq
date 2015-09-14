require('./stub') //stub out amqplib
var test = require('tape-catch')
var winston = require('winston')
winston.level = "debug"

var smq = require('../index.js')

test('Ensure callbacks are handled properly',function(t) {
  var obj1 = { foo: "bar", i:1 }
  t.plan(5)
  smq.connect(function(e) {
    t.false(e) //formallity, will be stubbed
    smq.provide("helloworld",function(obj2,cb) {
      t.deepEqual(obj1,obj2,"Ensure object passed in came back out")
      cb(null,obj2)
    })
    smq.request("helloworld",obj1,function(e,obj3) {
      t.false(e)
      t.deepEqual(obj1,obj3,"Ensure object makes round trip")
      smq.close(function(e) {
        t.false(e)
      })
    })
  })
})

test('Ensure errors are handled properly',function(t) {
  var obj1 = { foo: "bar", i:1 }
  t.plan(5)
  smq.connect(function(e) {
    t.false(e) //formallity, will be stubbed
    smq.provide("helloworld",function(obj2,cb) {
      t.deepEqual(obj1,obj2,"Ensure object passed in came back out")
      cb(obj2,null)
    })
    smq.request("helloworld",obj1,function(e,obj3) {
      t.deepEqual(obj1,e,"Ensure object makes round trip")
      t.false(obj3)
      smq.close(function(e) {
        t.false(e)
      })
    })
  })
})
