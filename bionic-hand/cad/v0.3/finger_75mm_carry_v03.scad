/*
CARRY-GRIP v0.3 - experimental 75 mm finger with a detachable / manually pinned carrying position.
PROJECT STATUS: CAD DEMONSTRATOR ONLY. Do not wear or carry real loads until analyzed, tested and fitted professionally.
Units mm. Controlled open/close 0..80 deg; pin can only engage at 80 deg. 2mm inner metal spine and bag-hook profile.
Load path in locked mode (concept): hook --> metal spine --> lock pin and MCP pin --> reinforced palm frame (not yet modeled) --> socket interface (not yet modeled).
Current palm part is a geometry/test placeholder and is NOT load-approved. 10kg not verified.
For 4-finger hand 85mm wide, this is ONE finger demonstrator only, not full-hand packaging.
*/
$fn=64;
angle=80;
export_part="assembly"; // assembly | four_fingers | palm | spine | spine_outline | upper_cover | lower_cover | middle | distal | rod1 | rod2
show_hardware=true;
show_lock_pin=true;
L1=35;L2=25;L3=15;
D1=[4,-3];V1=[2.5,4.5];D2=[0,7.5];V2=[-8.5,-4];
lock_angle=80; lock_radius=7; lock_at=[lock_radius*cos(lock_angle),lock_radius*sin(lock_angle)];
shaft_d=3.0;hole_d=3.2;fix_hole_d=2.25;
function add(u,v)=[u[0]+v[0],u[1]+v[1]];
function sub(u,v)=[u[0]-v[0],u[1]-v[1]];
function mul(u,s)=[u[0]*s,u[1]*s];
function mag(u)=sqrt(u[0]*u[0]+u[1]*u[1]);
function rot(v,a)=[v[0]*cos(a)-v[1]*sin(a),v[0]*sin(a)+v[1]*cos(a)];
function polar(r,a)=[r*cos(a),r*sin(a)];
function normalangle(a)=((a+540)%360)-180;
function circpivot(L,D,V,theta,sign)=
 let(B=polar(L,theta),r=mag(V),R=mag(sub(add([L,0],V),D)), db=sub(D,B),dist=mag(db),u=mul(db,1/dist),along=(r*r-R*R+dist*dist)/(2*dist),h=sqrt(max(0,r*r-along*along)),p=add(B,mul(u,along)),n=[-u[1],u[0]])
 add(p,mul(n,sign*h));
function follower(L,D,V,theta,sign)=
 let(B=polar(L,theta),P=circpivot(L,D,V,theta,sign))
 normalangle(atan2(P[1]-B[1],P[0]-B[0])-theta-atan2(V[1],V[0]));
pip=follower(L1,D1,V1,angle,-1);
dip=follower(L2,D2,V2,pip,+1);
B=polar(L1,angle);C=add(B,polar(L2,angle+pip));T=add(C,polar(L3,angle+pip+dip));
P1=add(B,rot(V1,angle+pip));Pa=add(B,rot(D2,angle));Pb=add(C,rot(V2,angle+pip+dip));
rod1_len=mag(sub(add([L1,0],V1),D1));rod2_len=mag(sub(add([L2,0],V2),D2));
module cap2(p,q,r){hull(){translate(p)circle(r=r);translate(q)circle(r=r);}}
module flatcap(p,q,r,zlo,zhi){translate([0,0,zlo])linear_extrude(height=zhi-zlo,convexity=6)cap2(p,q,r);}
module flatcirc(p,r,zlo,zhi){translate([p[0],p[1],zlo]) cylinder(r=r,h=zhi-zlo);}
module hole(p,d=hole_d){translate([p[0],p[1],-12]) cylinder(d=d,h=24);}
module shaft(p,z0,z1,r=1.5){translate([p[0],p[1],z0])cylinder(r=r,h=z1-z0);}
// Palm with two extra lock-sector ears. Actual structural metal palm frame remains unmodeled.
module palm_geom(){difference(){union(){
 flatcap([-22,0],[-14,0],4.8,-3.2,3.2);
 for(z=[-3.6,2.05]){
   flatcap([-14,0],[0,0],4.4,z,z+1.55);
   flatcap([-9,3.4],lock_at,2.8,z,z+1.55);
 }
 flatcap([-16,0],D1,3.3,4.25,6.25);
 flatcirc([-16,0],2.7,2.9,6.25);
 }hole([0,0]);hole(D1);hole(lock_at);}}
// Laser-cut / milled 2 mm metal spine. The connected J-hook is the load-contact feature.
// Bends out of plane, screw retention, pin tolerances and finish NOT designed.
module spine_geom(){difference(){union(){
 flatcap([-3,0],[24,0],3.2,-1,1);
 flatcap([12,0],[12,-8],3.0,-1,1);
 flatcap([12,-8],[23,-8],3.0,-1,1);
 flatcirc([23,-8],3.0,-1,1);
 }hole([0,0]);hole([lock_radius,0]);hole([16,0],fix_hole_d);hole([23,0],fix_hole_d);}}
// Plastic covers bolt to the metal spine. They do not carry the bag in the intended load path.
module cover_geom(top=true){
 zlo=top?1.4:-3.2; zhi=top?3.2:-1.4;
 forklo=top?2.05:-3.6; forkhi=top?3.6:-2.05;
 difference(){union(){
   flatcap([15.5,0],[L1-12,0],4.2,zlo,zhi);
   flatcap([L1-12,0],[L1,0],4.15,forklo,forkhi);
   if(!top){flatcap([L1-9,0],[L1,7.5],3.3,-6.25,-4.25);flatcirc([L1-9,0],2.7,-6.25,-2.9);}
  }hole([16,0],fix_hole_d);hole([23,0],fix_hole_d);hole([L1,0]);hole([L1,7.5]);
 }
}
module middle_geom(){difference(){union(){
 flatcap([9.5,0],[L2-11.5,0],4.1,-3.2,3.2);
 flatcap([-3,0],[8,0],3.25,-1.65,1.65);
 for (z=[-3.6,2.05])flatcap([L2-11.5,0],[L2,0],3.95,z,z+1.55);
 flatcap([8,0],V1,3.3,4.25,6.25);
 flatcirc([8,0],2.7,2.9,6.25);
 }hole([0,0]);hole([L2,0]);hole(V1);}}
module distal_geom(){difference(){union(){
 flatcap([8,0],[12,0],3,-3.2,3.2);
 flatcap([-3,0],[8,0],3.15,-1.65,1.65);
 flatcap([8,0],V2,3.3,-6.25,-4.25);
 flatcirc([8,0],2.7,-6.25,-2.9);
 }hole([0,0]);hole(V2);}}
module rod_geom(p,q,z0,z1){difference(){union(){
 flatcap(p,q,2.1,z0,z1);
 flatcirc(p,3.3,z0,z1);
 flatcirc(q,3.3,z0,z1);
 }hole(p);hole(q);}}
module assembled(){
 color([0.30,0.34,0.43])palm_geom();
 color([0.80,0.65,0.39])rotate([0,0,angle])spine_geom();
 color([0.72,0.78,0.85])rotate([0,0,angle])cover_geom(true);
 color([0.61,0.70,0.81])rotate([0,0,angle])cover_geom(false);
 color([0.49,0.66,0.85])translate([B[0],B[1],0])rotate([0,0,angle+pip])middle_geom();
 color([0.31,0.52,0.74])translate([C[0],C[1],0])rotate([0,0,angle+pip+dip])distal_geom();
 color([1,0.56,0.14])rod_geom(D1,P1,6.75,8.55);
 color([0.15,0.72,0.60])rod_geom(Pa,Pb,-8.55,-6.75);
 if(show_hardware){
   color([0.93,0.94,0.95]){
    for(p=[[0,0],B,C])shaft(p,-3.6,3.6);
    for(p=[D1,P1])shaft(p,4.25,8.55);
    for(p=[Pa,Pb])shaft(p,-8.55,-4.25);
    for(p=[rot([16,0],angle),rot([23,0],angle)])shaft(p,-3.3,3.3,1.0);
   }
   if(show_lock_pin && abs(angle-lock_angle)<0.001){
      color([0.9,0.16,0.12])shaft(lock_at,-4.0,4.0);
   }
 }
}
if(export_part=="assembly")assembled();
else if(export_part=="four_fingers") {
   // Layout check ONLY: not a verified assembled 85mm-wide hand, no palm frame and no motor enclosure.
   for(i=[0:3]) translate([0,0,(i-1.5)*20.5]) assembled();
}
else if(export_part=="spine_outline")projection(cut=false)spine_geom();
else if(export_part=="palm")palm_geom();
else if(export_part=="spine")spine_geom();
else if(export_part=="upper_cover")cover_geom(true);
else if(export_part=="lower_cover")cover_geom(false);
else if(export_part=="middle")middle_geom();
else if(export_part=="distal")distal_geom();
else if(export_part=="rod1")rod_geom([0,0],[rod1_len,0],0,1.8);
else if(export_part=="rod2")rod_geom([0,0],[rod2_len,0],0,1.8);
