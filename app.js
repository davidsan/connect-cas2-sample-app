var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');
var cas = require('connect-cas2');
var MemoryStore = require('session-memory-store')(session);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.enable('trust proxy');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  name: 'NSESSIONID',
  secret: 'Hello I am a long long long secret',
  store: new MemoryStore()  // or other session store
}));

// disable cert checking, do not use this in prod!
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

var casClient = new cas({
  debug: true,
    ignore: [
      /\/ignore/
    ],
    match: [],
    servicePrefix: 'https://casclient.example.com',
    serverPath: 'https://casserver.example.com',
    paths: {
      validate: '/validate',
      serviceValidate: '/serviceValidate',
      proxy: '/proxy',
      login: '/login',
      logout: '/logout',
      proxyCallback: '/proxyCallback'
    },
    redirect: false,
    gateway: false,
    renew: false,
    slo: true,
    cache: {
      enable: false,
      ttl: 5 * 60 * 1000,
      filter: []
    },
    fromAjax: {
      header: 'x-client-ajax',
      status: 418
    }
});

app.use(casClient.core());

app.get('/', function(req, res) {
  if (req.session.cas && req.session.cas.user) {
    
    res.render('authenticated', { title: req.session.cas.user });
  } else {
    res.render('index', { title: 'Not logged in' });
  }
});

app.get('/login', function(req, res, next) {
  casClient.login()(req, res, next);
});

app.get('/logout', casClient.logout());
 
// or do some logic yourself
app.get('/logout', function(req, res, next) {
  // Do whatever you like here, then call the logout middleware
  casClient.logout()(req, res, next);
});

module.exports = app;
