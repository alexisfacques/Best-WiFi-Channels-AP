/* =============================
    Alexis Facques - 20 / 03 / 17
 - ============================= */

module.exports = function(routers,channelId){
    // Filter the routers by channel id
    routers = routers.filter(function(router){
        if(router.channel != channelId) return false;
        return true;
    // Sorting them by rssi
    }).sort(function(r1,r2){
        if(r1.rssi < r2.rssi) return 1;
        else if (r1.rssi > r2.rssi) return -1;
        return 0;
    });

    // Returning the best router on the channel
    return routers[0];
};
