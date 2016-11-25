'use strict';

const Hapi = require('hapi'),
      server = new Hapi.Server();

server.connection({port: 80});

server.register(require('inert'), (err) => {
    if (err) throw err;

    server.route({
        method: 'GET',
        path: '/bundle/{file}',
        handler: function (request, reply) {
            reply.file('./bundle/' + encodeURIComponent(request.params.file));
        }
    });

    server.route({
        method: 'GET',
        path: '/{path*}',
        handler: function (request, reply) {
            reply.file('./routes/app.html');
        }
    });
});

server.start((err) => {
    if (err) throw err;
    console.log(`Server running at: ${server.info.uri}`);
});
