var amq = require("amqplib/callback_api")
var emitter = require('events').EventEmitter

var connection = {}
var channel = {}
var queues = new emitter()

amq.connect = function connect(url,cb) {
  return process.nextTick(function() {
    return cb(null,connection)
  })
}

connection.createChannel = function createChannel(cb) {
  return process.nextTick(function() {
    return cb(null,channel)
  })
}

connection.close = function close(cb) {
  cb = cb || function(){}
  return process.nextTick(function() {
    return cb()
  })
}

channel.assertQueue = function assertQueue(name,opts,cb) {
  cb = cb || function(){}
  return process.nextTick(function() {
    return cb()
  })
}

channel.consume = function consume(queue,cb,opts,cb2) {
  cb = cb || function(){}
  cb2 = cb2 || function(){}
  queues.on(queue,cb)
  return cb2()
}

channel.sendToQueue = function sendToQueue(queue,data) {
  return queues.emit(queue,data)
}

channel.ack = function ack() {
  return null
}

channel.close = function close() {
  return null
}
