var winston = require('winston')
var amq = require('amqplib/callback_api')
var async = require('async')
var uuid = require('node-uuid')
var uniq_id = uuid.v4()
var CONN = null
var messages = new (require('events').EventEmitter)()

var m = module.exports = {}

m.connect = function connect(cb) {
  async.during(singleConnect,waitingForConnection,function(e) {
    return cb(e)
  })
}

m.request = function request(event,obj,cb) {
  winston.debug("Requesting",event)
  if(typeof obj === "function") {
    cb = obj
    obj = null
  }
  setup(event,function(e,channel) {
    winston.debug("Asserting a callback queue")
    if(e) return cleanup(e,channel,cb)
    // Generate Callback Queue
    var cid = uuid.v4()
    assertCallbackQueue(channel,cid,cb,function(e) {
      if(e) return clenaup(e,channel,cb)
      send(channel,event,obj,cid)
    })
  })
}

m.provide = function provide(event,cb) {
  winston.debug("Providing",event)
  setup(event,function(e,channel) {
    if(e) return cleanup(e,channel,cb)
    setupConsumer(channel,event,function(msg) {
      var error = null
      var message = null
      try {
        message = JSON.parse(msg.content.toString())
      }
      catch(e) {
        error = e
      }
      return cb(message,function(e,res) {
        //TODO
      })
    })
  })
}

m.broadcast = function broadcast() {
}

m.subscribe = function subscribe() {
}

m.produce = function produce() {
}

m.consume = function consume() {
}

// Handles all the tedious stuff involved with channels, etc.
function setup(event,broadcast,cb) {
  winston.debug("Setting up a channel")
  if(typeof broadcast === "function") {
    cb=broadcast
    broadcast=null
  }
  if(!CONN) cb(new Error("No connection to RabbitMQ Established"))
  CONN.createChannel(function createdChannel(e,channel) {
    if(e) return cb(e)
    return assertQueue(channel,event,function assertedQueue(e) {
      winston.debug("Asserted the queue for",event)
      if(e) return cb(e)
      return cb(null,channel)
    })
  })
}

function cleanup(e,channel,cb) {
  winston.debug("Cleaning up channel...")
  winston.error(e)
  if(!channel || !channel.close) return cb()
  return channel.close(function closedChannel(){
    return cb(e)
  })
}

/**
 * Creates a queue in RabbitMQ.
 * If the isCallback value is truthy, then the queue will only
 * last for as long as the connection.
 */
function assertQueue(channel,queue,cb) {
  winston.debug("Asserting a queue for",queue)
  var opts = null
  channel.assertQueue(queue,opts,cb)
}

/**
 * Creates a callback queue that only exists for the life of the connection.
 */
function assertCallbackQueue(channel,id,callback,cb) {
  winston.debug("Creating a callback queue",id)
  assertQueue(channel,id,function(e) {
    if(e) return cb(e)
    // register listener
    setupConsumer(channel,id,function(msg) {
      var error = null
      var message = null
      try {
        var message = JSON.parse(msg.content.toString())
      } catch(e) {
        error = e
      }
      callback(error,msg)
    },true,cb)
  })
}

function setupConsumer(channel,queue,callback,isCallback,cb) {
  winston.debug("Creating a consumer of",queue)
  cb = cb || function() {}
  if(typeof isCallback === "function") {
    cb = isCallback
    isCallback = null
  }
  var opts = null
  if(isCallback) opts = { "exclusive":true,"noAck":true,"priority":Number.MAX_VALUE }
  channel.consume(queue,function(msg) {
    //TODO: Figure out why this is an array of bytes and not an object
    if(isCallback) return channel.deleteQueue(queue)
    winston.debug(msg)
    callback(msg)
  },opts,function(e) {
   cb(e)
  })
}

function send(channel,event,message,id) {
  winston.debug("Sending to",event)
  var opts = null
  if(id) opts = { correlationId:id, replyTo:id }
  channel.sendToQueue(event,new Buffer(JSON.stringify(message),opts))
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
