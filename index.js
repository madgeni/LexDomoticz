
var Domoticz = require('./node_modules/domoticz-api/api/domoticz');

var conf = require('./conf.json');

var api = new Domoticz({
    protocol: conf.protocol,
    host: conf.host,
    port: conf.port,
    username: conf.username,
    password: conf.password
});

function close(sessionAttributes, fulfillmentState, message) {
    console.log("Do i get here??")
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

function getDevs(intentRequest, callback){
    const sessionAttributes = intentRequest.sessionAttributes || {};
    var appliances = [];

    api.getDevices({}, function (error, devices) {
        var devArray = devices.results;
        if (devArray) {
            for (var i = 0; i < devArray.length; i++) {
                var device = devArray[i];

                // Omit devices which aren't in a room plan
                if (device.planID === '0')
                    continue;

                var devType = device.type;
                var setswitch = device.switchType;
                var dz_name = device.name;

                if (device.description !== "") {
                    // Search for Alexa_Name string, ignore casesensitive and whitespaces

                    var regex = /Alexa_Name:\s*(.+)/im;
                    var match = regex.exec(device.description);
                    if (match !== null) {
                        dz_name = match[1].trim();
                    }
                }

                var appliancename = {
                    friendlyName: dz_name,
                    status: device.data
                };
                appliances.push(appliancename);

            }
            let Devlist = JSON.stringify(appliances);
            devme = Devlist.toString()
          //  devme = devme.replace(/[{()}]/g, '');
            devme = devme.replace(/[\[\]']+/g, '');
            speechText = devme;

        }
         callback(close(sessionAttributes, 'Fulfilled',
            { contentType: 'PlainText', content: speechText }));
    })

}
function dispatch(intentRequest, callback) {

    const intentName = intentRequest.currentIntent.name;

    if (intentName === 'getDeviceStatus') {
        return getDevs(intentRequest, callback);
    }

    throw new Error(`Intent with name ${intentName} not supported`);
}

// --------------- Main handler -----------------------

function loggingCallback(response, originalCallback) {
    console.log(JSON.stringify(response, null, 2));
    originalCallback(null, response);
}

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

         if (event.bot.name !== 'ControlDomoticz') {
         callback('Invalid Bot Name');
         }

        dispatch(event, (response) => loggingCallback(response, callback));
    } catch (err) {
        callback(err);
    }
};