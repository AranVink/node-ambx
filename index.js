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

console.log("Looking for ambx");
const ambxDevice = usb.findByIds(usb_vid, usb_pid);

console.log("Opening device");
ambxDevice.open();

console.log("Using first interface");
const ambxInterface = ambxDevice.interfaces[0];
console.log("Claiming first interface");
ambxInterface.claim();

console.log("Getting out endpoint");
const ambxEndpoint = ambxInterface.endpoint(endpoint_out);
ambxEndpoint.transferType = usb.LIBUSB_TRANSFER_TYPE_INTERRUPT;

console.log("Setting light color to 0x10");
setAllLights(ambxEndpoint, 0x20, 0x20, 0x20);
//setLight(ambxEndpoint, 0x00, 0x00, 0x00);

console.log("Releasing interface");
ambxInterface.release(true, function (error) {
    console.log("Interface released");
    if (error) {
        console.log(error);
    }
    console.log("Closing ambxDevice");
    ambxDevice.close();
});

function setAllLights(ambxEndpoint, r, g, b) {
    const dataL = [0xA1, light_left, set_light_color, r, g, b];
    const dataWWL = [0xA1, light_ww_left, set_light_color, r, g, b];
    const dataWWC = [0xA1, light_ww_center, set_light_color, r, g, b];
    const dataWWR = [0xA1, light_ww_right, set_light_color, r, g, b];
    const dataR = [0xA1, light_right, set_light_color, r, g, b];

    ambxEndpoint.transfer(dataL, function (error) { console.log(error); });
    ambxEndpoint.transfer(dataWWL, function (error) { console.log(error); });
    ambxEndpoint.transfer(dataWWC, function (error) { console.log(error); });
    ambxEndpoint.transfer(dataWWR, function (error) { console.log(error); });
    ambxEndpoint.transfer(dataR, function (error) { console.log(error); });
}
