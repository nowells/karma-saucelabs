var sl = require('saucelauncher'),
    sauceConnected = /Connected! You may start your tests./,
    starting = false,
    connected = false;

var createSauceConnect = function(config, logger, emitter) {
    var log = logger.create('saucelabs');

    return function(content, file, done) {
        var tunnel, exit;

        if (starting) {
            done(content);
            return;
        }
        starting = true;

        log.info('Starting SauceLabs Tunnel');

        tunnel = new sl.SauceConnect({
            username: process.env.SAUCE_USERNAME,
            apiKey: process.env.SAUCE_APIKEY
        }).tunnel();

        exit = function(code) {
            log.info('Killing SauceLabs Tunnel');
            tunnel.on('close', function() {
                process.exit(code);
            });
            tunnel.kill();
        };

        emitter.once('exit', exit);
        process.once('SIGTERM', exit);
        process.once('SIGINT', exit);
        process.once('SIGQUIT', exit);
        process.once('SIGHUP', exit);

        tunnel.stdout.on('data', function(data) {
            if (sauceConnected.exec(data.toString())) {
                connected = true;
                log.info('SauceLabs Connected Successfully!');
                done(content);
            }
        });

        setTimeout(function() {
            if (!connected) {
                log.info('SauceLabs Connection Failed.');
                process.exit(1);
            }
        }, 60000);
    };
};

createSauceConnect.$inject = ['config', 'logger', 'emitter'];

module.exports = {
    'preprocessor:saucelabs': ['factory', createSauceConnect]
};
