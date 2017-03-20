/* =============================
    Alexis Facques - 20 / 03 / 17
    (MacOS Only)

    BEST_CHANNEL.JS finds the wifi channel with the least
    interference to give to your router for better connection speeds.

    Our strategy is :
        - Sorting the nearby sniffed routers by channels
        - Distributing these routers threw an array
          that represents all the channels they may or may not overlap
        - Comparing the max RSSI of each router and returning
          the channel with the smallest max RSSI

    Nb: An unused channel with no overlapping will return a -Infinity max RSSI
        resulting in being the best available channel

    If -r argument is defined, routers with this SSID will be filtered from the
    access points
    Use : node best_channel.js [-r: SSID]
 - ============================= */

const shell = require('child_process');
// Parsing the MacOS "airport" console output
const airportParser = require('./src/airport-parser.js');

// MacOS Tool & Cmd for wireless networking
const airport = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';
const cmd = airport + ' -s';

// You can filter your own routers from the list using the -r argument
// node best_channel.js -r SSID
const myRoutersSSID = require('minimist')(process.argv.slice(2)).r;
var myRouters = [];

shell.exec(cmd,function(e,stdout,stderr){
    // Getting access points info from the airport util and
    // filtering my own router(s) from the list, as well as channels that
    // do not belong to 2.4GHz
    var routers = airportParser(stdout).filter(function(router){
        // Good-bye my routers, good-bye my friends
        if(router.ssid == myRoutersSSID){
            // By the way, myRouter is an array, in case of multiple channels
            myRouters.push(router);
            return false;
        }
        // Only selecting the 2.4 GHz channels too
        else if(router.channel <= 13) return true;
        return false;
    });

    // Generating an array of objects representing all wifi channels
    // What an ugly way to do it though :(
    var channels = [];
    for(var i = 1; i <= 13; i++){
        channels.push({
            id: i,
            routers : []
        })
    };

    // Filling this empty array of objects with routers
    routers.forEach(function(router){
        var overlappingStart = Number.parseInt(router.channel) - 4;
        if (overlappingStart < 1) overlappingStart = 1;
        var overlappingEnd = Number.parseInt(router.channel) + 4;
        if (overlappingEnd > 13) overlappingEnd = 13;

        // Distributing the current router in ALL the channels it actually overlaps
        // depending of it's current channel
        for (var i = overlappingStart - 1; i < overlappingEnd; i++) {
            channels[i].routers.push(router);
        }
    });

    // My routers informations
    if(myRoutersSSID){
        console.log('\nMy router(s) :',myRoutersSSID);
        myRouters.forEach(function(myRouter){
            console.log('++ Current RSSI on channel #'+myRouter.channel,':',myRouter.rssi,'dBm');
        });
    };

    // Best channel is the one with the highest "max RSSI", of all the access points
    // that overlap with it
    // (1 router on channel#1 influences channel#1,2,3,4,5)
    var stats = channels.map(function(channel){
        // Returns a simplified arrays of objets representing the channels.
        return {
            // Channel id
            id: channel.id,
            // Number of access points overlapping with the channel
            apNbr: channel.routers.length,
            // Max RSSI from all the routers that overlap with it
            rssi: Math.max.apply(null,channel.routers.map(function(router){
                return router.rssi;
            }))
        }
    // At this point we have an unsorted of objects representing channels
    }).sort(function(r1,r2){
        // Sorting by Max RSSI on overlapping channels
        if(r1.rssi < r2.rssi) return -1;
        else if (r1.rssi > r2.rssi) return 1;
        // If RSSIs are identical, always prefer one of those 3 channels
        // as they are the only 2.4GHz non-overlapping channels (avoid future interferences)
        else if (r1.id == 1 || r1.id == 6 || r1.id == 11) return -1;
        else if (r2.id == 1 || r2.id == 6 || r2.id == 11) return 1;

        else return 0;
    });
    // At this point, our array of channels is sorted by rssi

    console.log('=== BEST 2.4GHZ CHANNEL IS #'+stats[0].id,'===');

});
