'use strict';
const usb = require('usb'),

    //USB VID and PID
    usb_vid = 0x0471,
    usb_pid = 0x083F,

    //Usb endpoints
    endpoint_in = 0x81,
    endpoint_out = 0x02,
    endpoint_pnp = 0x83,

    // -- Commands --

    // Set a single color, for a specific light
    // Params 0xRR 0xGG 0xBB
    // 0xRR = Red color
    // 0xGG = Green color
    // 0xBB = Blue color
    set_light_color = 0x03,

    // Set a color sequence using delays
    // Params 0xMM 0xMM then a repeated sequence of 0xRR 0xGG 0xBB
    // 0xMM = milliseconds
    // 0xMM = milliseconds
    // 0xRR = Red color
    // 0xGG = Green color
    // 0xBB = Blue color
    set_timed_color_sequence = 0x72,

    //LEFT/RIGHT lights. Normally placed adjecent to your screen.
    light_left = 0x0B,
    light_right = 0x1B,

    //Wallwasher lights. Normally placed behind your screen.
    light_ww_left = 0x2B,
    light_ww_center = 0x3B,
    light_ww_right = 0x4B;

console.log("Looking for AMBX devices");
let deviceList = []
usb.getDeviceList().forEach(element => {
    if (element.deviceDescriptor.idVendor == usb_vid && element.deviceDescriptor.idProduct == usb_pid) {
        deviceList.push(element);
    }
});

console.log(`Found ${deviceList.length} AMBX devices`);
if (deviceList.length == 0) {
    return;
}

let endpointList = []

deviceList.forEach(device => {
    console.log("Opening device");
    device.open();

    console.log("Using first interface");
    const ambxInterface = device.interfaces[0];
    console.log("Claiming first interface");
    ambxInterface.claim();

    console.log("Getting out endpoint");
    const ambxEndpoint = ambxInterface.endpoint(endpoint_out);
    ambxEndpoint.transferType = usb.LIBUSB_TRANSFER_TYPE_INTERRUPT;
    endpointList.push(ambxEndpoint);
});


start(endpointList);
async function start(endPointList) {
    //while(true) {
        //await sweep(endpointList);
    //}
    //for (let c = 0; c < 256; c++) {

        const asyncFunctions = endpointList.map((value) => {return setAllLights(value, 0, 255, 0);})
    await Promise.all(asyncFunctions);
        //setAllLights(ambxEndpoint, 256, 256, 256);
        //await sleep(waittime)
    //}
}

async function sweep(endpointList) {
    const asyncFunctions = endpointList.map((value) => {return colorSweep(value);})
    await Promise.all(asyncFunctions);
}

function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function setAllLights(ambxEndpoint, r, g, b) {
    const dataL = [0xA1, light_left, set_light_color, r, g, b];
    const dataWWL = [0xA1, light_ww_left, set_light_color, r, g, b];
    const dataWWC = [0xA1, light_ww_center, set_light_color, r, g, b];
    const dataWWR = [0xA1, light_ww_right, set_light_color, r, g, b];
    const dataR = [0xA1, light_right, set_light_color, r, g, b];

    ambxEndpoint.transfer(dataL, function (error, data) { transferCallback(error, dataL, data, "L"); });
    ambxEndpoint.transfer(dataWWL, function (error, data) { transferCallback(error, dataWWL, data, "WWL"); });
    ambxEndpoint.transfer(dataWWC, function (error, data) { transferCallback(error, dataWWC, data, "WWC"); });
    ambxEndpoint.transfer(dataWWR, function (error, data) { transferCallback(error, dataWWR, data, "WWR"); });
    ambxEndpoint.transfer(dataR, function (error, data) { transferCallback(error, dataR, data, "R"); });
}

function transferCallback(error, dataSent, data, light) {
    if (error) {
        console.log(`${error} ${light} ${dataSent} ${data}`);
    }
}

async function colorSweep(ambxEndpoint) {
    console.log("Setting light colors red");
    let r, g, b = 0
    let waittime = 5
    for (r = 0; r < 256; r++) {
        setAllLights(ambxEndpoint, r, g, b);
        await sleep(waittime)
    }
    r = 0;
    console.log("Setting light colors green");
    for (g = 0; g < 256; g++) {
        setAllLights(ambxEndpoint, r, g, b);
        await sleep(waittime)
    }
    g = 0;
    console.log("Setting light colors blue");
    for (b = 0; b < 256; b++) {
        setAllLights(ambxEndpoint, r, g, b);
        await sleep(waittime)
    }
    console.log("Setting light colors white");
    for (let c = 0; c < 256; c++) {
        setAllLights(ambxEndpoint, c, c, c);
        await sleep(waittime)
    }
}

function release() {
    console.log("Releasing interface");
    ambxInterface.release(true, function (error) {
        console.log("Interface released");
        if (error) {
            console.log(error);
        }
        console.log("Closing ambxDevice");
        ambxDevice.close();
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {
    //graceful shutdown
    process.exit();
});