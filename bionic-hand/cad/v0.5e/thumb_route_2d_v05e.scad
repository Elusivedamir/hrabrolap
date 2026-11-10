/* v0.5e isolated 2D route schematic, not a connected 3D assembly.
   Parameters in millimetres; positive angle is MCP flexion. The cable segment
   is a geometric surrogate; no pulley, tendon, anchor, sleeve, IP coupling,
   CMC through-route, electrical parts or seal is modeled. The old boot rectangle
   denotes a packaging reservation, not an actual waterproof shell.

   Example: openscad -D 'flex_deg=20' -D 'route_y=7' -o schematic_20.svg thumb_route_2d_v05e.scad
*/
flex_deg = 20;       // 0..20 from v0.5d sampling; 20..60 exploratory only
route_y = 7;        // studied: 5, 6, 7, 8
frame_line = 0.35;
boot_x = [-16,7];
boot_y = [-7,7];
guide = [-12,route_y];
anchor = [12*cos(flex_deg)-route_y*sin(flex_deg),12*sin(flex_deg)+route_y*cos(flex_deg)];

module line_between(a,b,r=0.35) hull(){translate(a) circle(r=r,$fn=24);translate(b) circle(r=r,$fn=24);}
module tab_outline(x0,x1,y0,y1,t=0.25) difference(){
    translate([x0,y0]) square([x1-x0,y1-y0]);
    translate([x0+t,y0+t]) square([x1-x0-2*t,y1-y0-2*t]);
}
module reference(){
    color([0.5,0.5,0.5]) tab_outline(boot_x[0],boot_x[1],boot_y[0],boot_y[1]);
    color([0.4,0.4,0.4]) circle(r=1.5,$fn=72); // modeled pin diameter 3
    color([0.8,0.8,0.8]) difference(){circle(r=6.25,$fn=96);circle(r=6.00,$fn=96);} // only proxy obstacle
}
module geometry(){
    color([0.1,0.4,0.8]) line_between([0,0],anchor,0.2); // proximal shaft axis projection
    color([0.2,0.8,0.3]) line_between(guide,anchor,frame_line);
    color([0.1,0.7,0.3]) translate(guide) circle(r=0.8,$fn=36);
    color([0.1,0.7,0.3]) translate(anchor) circle(r=0.8,$fn=36);
}
reference();geometry();
