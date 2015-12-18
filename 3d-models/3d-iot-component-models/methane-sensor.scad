// A CNG-Methane sensor MQ-4 ordered from https://www.sparkfun.com/products/9404

$fn = 32;

pin_length = 7.7;

module center() {
    cylinder(h = 6.4, r = 19/2);
}

module top() {
    translate([0, 0, 18 - 16/2])
        sphere($fn=8, r=16/2);
}

module pin(theta = 0) {
    color("black") rotate([180, 0, theta]) {
        translate([6, 0, 0])
            cylinder($fn=8, r=.3, h=pin_length);
    }
}

module methane_sensor() {
    color("grey") center();
    color("violet") top();
    pin(theta = 0);
    pin(theta = 45);
    pin(theta = -45);
    pin(theta = 180);
    pin(theta = 180 + 45);
    pin(theta = 180 - 45);
}

methane_sensor();