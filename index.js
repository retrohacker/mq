var winston = require('winston')
winston.level = 'debug'
var amq = require('amqplib/callback_api')
var async = require('async')
var uuid = require('node-uuid')
var uniq_id = uuid.v4()
var CONN = null
var messages = new (require('events').EventEmitter)()
winston.debug(messages)
var channel = null
var Qs = []
var CBs = []

var m = module.exports = {}

m.on = function(queue,cb) {
  async.waterfall([
    establishChannel,
    assertQueue(queue),
    registerListener(queue)
  ],function(e) {
    if(e) return winston.error(e)
    else winston.info("Listening for ",queue)
    messages.on(queue,cb)
  })
}

function establishChannel(cb) {
  if(channel) return cb()
  winston.debug("Establishing a channel")
  CONN.createChannel(function(e,ch) {
    if(e) return cb(e)
    channel=ch
    return cb()
  })
}

function assertQueue(queue,opts) {
  return function(cb) {
    winston.debug("Asserting Queue ",queue)
    return channel.assertQueue(queue,opts,function(){return cb()})
  }
}

function registerListener(queue) {
  return function(cb) {
    if(Qs[queue]) return cb()
    winston.debug("Registering Listener for ",queue)
    Qs[queue] = true
    channel.consume(queue,function(msg) {
      if(msg !== null) {
        channel.ack(msg)
        messages.emit(queue,msg.content.toString(),msg)
      }
    })
    return cb()
  }
}

m.send = function send(queue,data,opts) {
  async.waterfall([
    establishChannel,
    assertQueue(queue)
  ],function(e) {
    if(e) return winston.error(e)
    winston.debug("Sending  [[",data,"]] to ",queue)
    return channel.sendToQueue(queue,new Buffer(data),opts)
  })
}

m.connect = function connect(cb) {
  async.during(singleConnect,waitingForConnection,function(e) {
    return cb(e)
  })
}

function singleConnect(cb) {
  winston.info("Trying to connect to rabbitmq...")
  return amq.connect('amqp://mq',function(e,conn) {
    CONN = conn
    return cb(null,e)
  })
}

function waitingForConnection(cb) {
  winston.info("Connection to rabbitmq failed, retrying...")
  setTimeout(cb,1000)
}

m.trigger = function trigger(key,value,cb) {
  winston.debug("Calling ",key," with values ",value)
  async.waterfall([
    establishChannel,
    assertCallbackQueue,
    assertQueue(key),
    generateRCP(key,value,cb)
  ],function(e) {
    if(e) return winston.error(e)
  })
}

m.handle = function handle(key,cb) {
  winston.debug("Registering handler for",key)
  async.waterfall([
    establishChannel,
    assertQueue(key),
    registerHandler(key,cb)
  ],function(e) {
    if(e) return winston.error(e)
  })
}

function registerHandler(key,callback) {
  return function(cb) {
    winston.debug("Registering listener for handler for",key)
    registerListener(key)(function(e) {
      if(e) return cb(e)
      messages.on(key,function(content,msg) {
        winston.debug("Received msg!")
        callback(null,JSON.parse(content),function(e,response) {
          m.send(msg.properties.replyTo,JSON.stringify(e||response),{correlationId:msg.properties.correlationId})
        })
      })
      return cb()
    })
  }
}

function generateRCP(key,value,callback) {
  return function(cb) {
    winston.debug("Generating RCP:",key,value)
    var cid = uuid.v4()
    CBs[cid] = callback
    channel.sendToQueue(key,new Buffer(JSON.stringify(value)),{correlationId:cid,replyTo:uniq_id})
  }
}

function assertCallbackQueue(cb) {
  winston.debug("Creating a callback queue")
  assertQueue(uniq_id)(function(e) {
    if(e) return cb(e)
    registerListener(uniq_id)(function(e) {
      if(e) return cb(e)
      messages.on(uniq_id,function(content,msg) {
        winston.debug("Received callback!")
        var id = msg.properties.correlationId
        if(id&&CBs[id]) CBs[id](JSON.parse(content))
      })
      return cb()
    })
  })
}
