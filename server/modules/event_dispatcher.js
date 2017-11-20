function EventDispatcher() {
  this.callbacks = [];
  this.counter = 0;
}

module.exports = EventDispatcher;

function wrapCallback(callback) {
  return function(data) {
    process.nextTick(function() {
      callback(data);
    });
  };
}

EventDispatcher.prototype.on = function(eventName, callback) {
  ++this.counter;
  this.callbacks.push({
      id: this.counter,
      eventName: eventName,
      callback: wrapCallback(callback)
  });
};

EventDispatcher.prototype.removeListener = function(id) {
  for (var i = 0; i < this.callbacks.length; ++i) {
    if (this.callbacks[i].id == id) {
      this.callbacks.splice(i, 1);
      return;
    }
  }
};

EventDispatcher.prototype.dispatchEvent = function(eventName, data) {
  for (var i = 0; i < this.callbacks.length; ++i) {
    if (this.callbacks[i].eventName == eventName) {
      this.callbacks[i].callback(data);
    }
  }
};

