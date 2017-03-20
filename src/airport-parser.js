/* =============================
    Alexis Facques - 20 / 03 / 17
    (MacOS Only)

    AIRPORT_PARSER.JS PARSE THE 'airport -s' MACOS COMMAND'S STDOUT
    AND RETURNS AN ARRAY OF ROUTERS
 - ============================= */

// Mac address regular expression :
// (["Any character 0-9 a-z A-Z" 2 times] followed by [":" 1 time]) 5 times) followed by (["Any character 0-9 a-z A-Z" 2 times]
const macAddrRegex = /([0-9a-zA-Z]{2}[:]{1}){5}[0-9a-zA-Z]{2}/;

module.exports = function(stdout){
    // Splitting stdout by lines in an array
    var lines = stdout.split('\n');

    // Function returns an array of json objects as followed :
    // ssid: String, macAddr: String, rssi: Integer, channel: Integer}
    return lines.map(function(line){
        // Checking if there's a mac address in the line
        var macAddr = line.match(macAddrRegex) || false;

        // No mac address ? Returning empty object
        if(!macAddr) return false;
        else{
            // Else spliting the line to retrieve information starting from the macAddr index
            // SSID with spaces or special characters are messy
            var elems = line.substr(macAddr.index).split(/[ ]+/);

            return {
                // SSID is the trimmed String of any character before the macAddr
                ssid: line.substr(0,macAddr.index).trim(),
                mac: elems[0].trim(),
                rssi: parseInt(elems[1].trim(),10),
                channel: parseInt(elems[2].trim(),10)
            };
        }
    }).filter(function(line){
        // Normally two empty elements we need to filter : First and last line
        if(line) return true;
        return false;
    });
};
