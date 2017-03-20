/* =============================
    Alexis Facques - 20 / 03 / 17
    (MacOS Only)

    ACCESS_POINTS.JS finds the nearest router (with the best signal strength)
    to connect to (knowing the access point's SSID).
    - Returns the channel used
    - The signal strength
    - The router's ESSID (mac address)

    Our strategy is :
        - Sorting the nearby sniffed routers by SSID
        - Comparing the max RSSI of each router and returning
          the router with the highest RSSI

    If SSID is set, filtering the results for this specific router
    Unfortunately, we cannot connect to a specific ESSID anymore on MacOS :(
    ----> networkconfig cmd now determine automatically the best ESSID to connect to

    Use : node access_point.js [SSID]
 - ============================= */

const shell = require('child_process');
const airportParser = require('./src/airport-parser.js');
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

    Object.keys(ret).forEach(function(key){
        console.log('\nAccess point :',key)
        console.log('++ Nearby routers using this SSID :',ssids[key].length);
        console.log('++ Nearest router\'s BSSID :',ssids[key][0].mac);
        console.log('++ Broadcasting on channel :',ssids[key][0].channel);
        console.log('++ Signal strength (highest is better) :',ssids[key][0].rssi+'dBm');
    });
});
