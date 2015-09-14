var mq = require('../index.js')

mq.connect(function(e) {
  handleError(e)
  console.log("Created connection")
  mq.close(function(e) {
    handleError(e)
    console.log("Closed connection")
  })
})

function handleError(e) {
  if(e) {
    console.error(JSON.stringify(e))
    return process.exit(1)
  }
}
