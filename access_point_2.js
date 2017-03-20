/* =============================
    Alexis Facques - 20 / 03 / 17
    (MacOS Only)

    ACCESS_POINTS_2.JS finds the nearest router (with the best signal strength)
    to connect to (knowing the access point's SSID).
    - Returns the channel used
    - The signal strength
    - The router's ESSID (mac address)

    SAME AS ACCESS_POINTS.JS but this version keep track of the use on the channel

    V3 would consist in :
    - Checking overlapping channels for talkative routers too
    - Using these results in order to help the user choose the best BSSID

    Use : node access_point_2.js [SSID]
 - ============================= */

const shell = require('child_process');
const airportParser = require('./src/airport-parser.js');

// Just an encapsulation of a function returning the best router on the considered channel
// V3 would consist in looping this function over all overlapping channels
const checkChannel = require('./src/best-on-channel.js')
const argv = require('minimist')(process.argv.slice(2));

// MacOS Tool & Cmd for wireless networking
const airport = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
const cmd = airport + ' -s';

// You can filter your own routers from the list using the -r argument
// node access_point.js SSID
const ssid = argv._[0] || undefined;

shell.exec(cmd,function(e,stdout,stderr){
    // Parsing the MacOS "airport" console output
    var routers = airportParser(stdout);

    var ssids = {};
    // Sorting by RSSI
    routers.sort(function(r1,r2){
        if(r1.rssi < r2.rssi) return 1;
        else if (r1.rssi > r2.rssi) return -1;
        // If RSSIs are identical, always prefer one of those 3 channels
        // as they are the only 2.4GHz non-overlapping channels (avoid future interferences)
        else if (r1.id == 1 || r1.id == 6 || r1.id == 11) return -1;
        else if (r2.id == 1 || r2.id == 6 || r2.id == 11) return 1;

        else return 0;
    // Then referencing the routers by SSID as well as by Channels
    }).forEach(function(router){
        if(!ssids[router.ssid]) ssids[router.ssid] = [];
        ssids[router.ssid].push(router);
    })

    console.log('\n'+Object.keys(ssids).length,'access point(s) detected.');
    // Point is just to filter the results is SSID has been defined
    var ret = {};
    if(ssid && !ssids[ssid]) console.log('\nRouter :',ssid,'can\'t be found.');
    else if(ssid) ret[ssid] = ssids[ssid];
    else ret = ssids;

    Object.keys(ssids).forEach(function(key){
        console.log('\nAccess point :',key)
        console.log('++ Nearby routers using this SSID :',ssids[key].length);
        console.log('++ Nearest router\'s BSSID :',ssids[key][0].mac);
        console.log('++ Broadcasting on channel :',ssids[key][0].channel);
        console.log('++ Signal strength (highest is better) :',ssids[key][0].rssi+'dBm');

        // Here is the new stuff  :
        // Just an encapsulation of a function returning the best router on the considered channel
        // V3 would consist in looping this function over all overlapping channels
        var bestOnChannel = checkChannel(routers,ssids[key][0].channel);
        if(bestOnChannel.ssid != key){
            var ssDiff = Number.parseInt(bestOnChannel.rssi) - Number.parseInt(ssids[key][0].rssi);

            console.log('\n!! The best AP on this channel is :',bestOnChannel.ssid);
            console.log('!! Signal strength difference is (>20dBm may cause severe interferences) :',ssDiff+'dBm');
            if(ssDiff>=20) console.log('!! You may expect severe interferences.');
        }
    });

});
