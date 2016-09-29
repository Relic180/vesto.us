'use strict';

const Hapi = require('hapi'),
      server = new Hapi.Server();

server.connection({
    host: 'localhost',
    port: 8000
});

server.route({
    method: 'GET',
    path:'/',
    handler: function (request, reply) {

    }
});

/////////////////////////////////////////////////////////

server.start((err) => {
    if (err) throw err;

    console.log('Server running at:', server.info.uri);
});
