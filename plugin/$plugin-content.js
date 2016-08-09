var inspectedWindow = chrome.devtools.inspectedWindow;
var connected = false;
var client;
var listenners = {};
var callbacks = {};
var page = chrome.extension.connect({
  name: 'basisjsDevtool:plugin'
});

function slice(value){
  return Array.prototype.slice.call(value);
}

function genUID(len){
  function base36(val){
    return Math.round(val).toString(36);
  }

  // uid should starts with alpha
  var result = base36(10 + 25 * Math.random());

  if (!len)
    len = 16;

  while (result.length < len)
    result += base36(new Date * Math.random());

  return result.substr(0, len);
}

page.onMessage.addListener(function(packet){
  console.log('[plugin] recieve:', packet);

  var args = packet.data;
  var callback = packet.callback;

  if (packet.event == 'callback')
  {
    if (callbacks.hasOwnProperty(callback))
    {
      callbacks[callback].apply(null, args);
      delete callbacks[callback];
    }
    return;
  }

  if (callback)
    args = args.concat(function(){
      page.postMessage({
        event: 'callback',
        callback: callback,
        data: slice(arguments)
      });
    });

  var list = listenners[packet.event];
  if (list)
    for (var i = 0, item; item = list[i]; i++)
      item.fn.apply(item.context, args);
});

var transport = {
  on: function(eventName, fn, context){
    if (!listenners[eventName])
      listenners[eventName] = [];

    listenners[eventName].push({
      fn: fn,
      context: context
    });

    return this;
  },

  send: function(){
    var args = slice(arguments);
    var callback = false;

    if (args.length && args[args.length - 1])
    {
      callback = genUID();
      callbacks[callback] = args.pop();
    }

    page.postMessage({
      event: 'data',
      data: args,
      callback: callback
    });
  }
};

transport
  .on('connect', function(){
    indy.style.background = 'green';
    transport.send({ x: 1 }, 1, 2, function(a){
      console.log('CALLBACK from page!!!', a || 'FAIL');
    });
  })
  .on('disconnect', function(){ indy.style.background = 'blue'; })
  .on('data', function(a, b, c, cb){
    console.log('[plugin] recieve data', arguments);
    console.info('[plugin]', a, b, c);
    if (typeof cb !== 'function') debugger;
    cb('OK');
  });

page.postMessage({
  event: 'plugin:init',
  tabId: inspectedWindow.tabId
});

var indy = document.createElement('div');
indy.style = 'position:fixed;z-index:111;top:10px;left:10px;background:red;width:20px;height:20px;'
document.documentElement.appendChild(indy);

var iframe = document.createElement('iframe');
iframe.srcdoc = 'todo';
document.documentElement.appendChild(iframe);
