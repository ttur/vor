'use strict';
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const socketIO = require('socket.io');
const Rx = require('rx');
const redis = require('redis');
const expressRedisCache = require('express-redis-cache');
const { BEACONS, CACHE_PREFIX, CACHE_TTL } = require('config');
const Location = require('app/location');
const viewRoute = require('app/views/routes');
const views = require('app/views');

// set up app
const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.text({type: '*/*'}));
app.use(logger('dev'));
// set up socket.IO
app.io = socketIO();
app.io.on('error', error => console.error(`Error - Socket connection error: ${error} : ${new Date}`));

// set up cache storage
const cacheClient = () => {
  let redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return redis.createClient(redisUrl);
  } else {
    return redis.createClient();
  }
};
const cache = expressRedisCache({ client: cacheClient(), prefix: CACHE_PREFIX });

// listen socket connections
const socketConnectionSource$ = Rx.Observable.fromEvent(app.io.sockets, 'connection');

// listen socket beacons
const socketBeaconSource$ = socketConnectionSource$
  .flatMap(socket => Rx.Observable.fromEvent(socket, 'beacon'));

// listen socket messages
const socketMessageSource$ = socketConnectionSource$
  .flatMap(socket => Rx.Observable.fromEvent(socket, 'message'));

// listen socket init
const socketInitSource$ = socketConnectionSource$
  .flatMap(socket => Rx.Observable.fromEvent(
      socket,
      'init',
      event => socket) // we need socket to emit cache content only to one client
    );

// Post interface for messages
// TODO: At the moment Arduinos' have limited websocket support. Remove when unnecessary.
const postMessageSubject = new Rx.Subject();
const postMessageRoute = router.post('/messages', (req, res) => {
  try {
    const json = JSON.parse(req.body);
    postMessageSubject.onNext(json);
    res.send('OK');
  }
  catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});
app.use('/messages', postMessageRoute);

// init location module
const location = new Location(BEACONS);
// subscribe location
location.fromDeviceStream(socketBeaconSource$)
  .subscribe(
    location => app.io.emit('location', location),
    error => console.error(`Error - location stream: ${error} : ${new Date}`)
  );

// subscribe init
const cacheGet = Rx.Observable.fromNodeCallback(cache.get, cache);
socketInitSource$
  .flatMap(socket => cacheGet().map(messages => [socket, messages]))
  .subscribe(
    ([socket, messages]) => {
      console.log(`Server - fetched ${messages.length} messages from cache : ${new Date}`);
      const messagesAsJson = messages.map(message => JSON.parse(message.body));
      socket.emit('init', messagesAsJson);
    },
    error => console.error(`Error - init stream: ${error} : ${new Date}`)
  );

// subscribe messages
const cacheAdd = Rx.Observable.fromNodeCallback(cache.add, cache);
postMessageSubject
  .merge(socketMessageSource$)
  .flatMap(message => {
    const key = message.id ? `${message.type}:${message.id}` : `${message.type}`;
    const data = JSON.stringify(message);
    const config = { expire: CACHE_TTL, type: 'json' };
    return cacheAdd(key, data, config);
  })
  .subscribe(
    ([key, data, status]) => {
      const messageAsJson = JSON.parse(data.body);
      console.log(`Server - received and stored '${messageAsJson.type}' message to cache : ${new Date}`);
      app.io.emit('message', messageAsJson);
    },
    error => console.error(`Error - message stream: ${error} : ${new Date}`)
  );

// the test page
app.use('/', viewRoute(router));
views.renderTestPage(app);

module.exports = app;