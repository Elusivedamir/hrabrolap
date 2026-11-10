// OpenSCAD parametric system v0.4 : FRAME+4 CARRY fingers, NON-WEARABLE concept.
// x=-122..0 nominal 122mm palm. z ±42.5 envelope 85mm. 50mm reserved -172..-122.
// v0.3 linked 75mm finger remains as supplied. v0.4 upgrades the fixed MCP module with a metal mounting shoe.
// Use -D 'v04_view="cartridge"' to export v04 cartridge STL.
// Use v04_view="assembly" and angle=0..80 for four-finger pose.
include <finger_75mm_carry_v03.scad>
export_part="_suppressed_by_v04_";
v04_view="assembly";
angle=80; // edit 0..80 or override using -D
$fn=64;
centres=[-30.75,-10.25,10.25,30.75];

module shoe_raw(){
    // y=-7.5..-3.8, z=-6.5..6.5, connected to old v03 sector/support body.
    translate([-29,-7.5,-6.5]) cube([21,3.7,13]);
}
module cartridge_v04(){
    difference(){
        union(){ palm_geom(); shoe_raw(); }
        for(x=[-23,-13]) translate([x,-16,0]) rotate([-90,0,0]) cylinder(d=3.4,h=30);
    }
}
module v04_one_finger(){
 color([0.62,0.68,0.76]) cartridge_v04();
 color([0.83,0.62,0.27]) rotate([0,0,angle]) spine_geom();
 color([0.83,0.87,0.91]) rotate([0,0,angle]) cover_geom(true);
 color([0.63,0.71,0.82]) rotate([0,0,angle]) cover_geom(false);
 color([0.49,0.66,0.85]) translate([B[0],B[1],0]) rotate([0,0,angle+pip]) middle_geom();
 color([0.31,0.52,0.74]) translate([C[0],C[1],0]) rotate([0,0,angle+pip+dip]) distal_geom();
 color([1,0.56,0.14]) rod_geom(D1,P1,6.75,8.55);
 color([0.15,0.72,0.60]) rod_geom(Pa,Pb,-8.55,-6.75);
 if(show_hardware){
  color([0.92,0.93,0.95]){
   for(p=[[0,0],B,C])shaft(p,-3.6,3.6);
   for(p=[D1,P1])shaft(p,4.25,8.55);
   for(p=[Pa,Pb])shaft(p,-8.55,-4.25);
   for(p=[rot([16,0],angle),rot([23,0],angle)])shaft(p,-3.3,3.3,1);
  }
  if(show_lock_pin && abs(angle-80)<0.001)color([0.91,0.24,0.18])shaft(lock_at,-4,4,1.5);
  for(x=[-23,-13])color([0.8,0.8,0.82]) translate([x,-13.25,0])rotate([-90,0,0])cylinder(d=3,h=17);
 }
}
module frame_v04(){color([0.29,0.36,0.44])import("palm_v04_parts/palm_chassis_v04.stl");}
module connector_reserved(){
 // Display only (orange transparent) - NO STRUCTURAL CONNECTOR EXISTS.
 color([1.0,0.65,0.25,0.18])translate([-172,-15,-26])cube([50,26,52]);
}
if(v04_view=="cartridge")cartridge_v04();
else if(v04_view=="frame")frame_v04();
else if(v04_view=="assembly"){
 frame_v04();
 for(z=centres)translate([0,0,z])v04_one_finger();
}
else if(v04_view=="envelope"){
 frame_v04();
 for(z=centres)translate([0,0,z])v04_one_finger();
 connector_reserved();
 // ±42.5 guide rails show width only
 color([0.95,0.25,0.20,0.45]) for(z=[-42.5,42.5])translate([-122,-16,z])cube([122,0.4,0.5]);
}
