module.exports = {
    init: function (path) {
        var file = require('fs');
        var ee = require('@google/earthengine');
        var pk = JSON.parse(file.readFileSync(path, 'UTF8'));
        ee.data.authenticateViaPrivateKey(pk);
        return ee;
    }
};
