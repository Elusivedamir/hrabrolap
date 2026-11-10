#!/usr/bin/env python3
"""Generate visibly accurate rigid transforms for corrected *prescribed* thumb CMC/IP motion.
CAD geometry is a kinematic concept, not a mechanical assembly or safe prosthesis.
"""
from pathlib import Path
import subprocess,math,json, numpy as np, vtk, trimesh
from PIL import Image,ImageDraw,ImageFont
from vtk.util.numpy_support import numpy_to_vtk,numpy_to_vtkIdTypeArray,vtk_to_numpy
from scipy.spatial.transform import Rotation as Rot
from build_thumb_motor_v05c import DIGITS, THUMB, R_OPEN, ROT_VEC, A, B, C, U, RCRANK, thumb_pose, finger_solid_parts
from thumb_corrected_v05b import Rz
ROOT=Path(__file__).resolve().parent
scene=trimesh.load(ROOT/'thumb_motor_v05c_rest.glb',force='scene')
W,H,FPS=1040,680,10
renderer=vtk.vtkRenderer();renderer.SetBackground(.90,.93,.97);renderer.SetBackground2(.986,.990,1);renderer.GradientBackgroundOn()
win=vtk.vtkRenderWindow();win.SetOffScreenRendering(True);win.SetSize(W,H);win.SetMultiSamples(4);win.AddRenderer(renderer)
renderer.AutomaticLightCreationOff()
for position,power in [((165,200,235),1.1),((-125,-190,100),.65),((-70,100,-120),.55)]:
 light=vtk.vtkLight();light.SetPosition(*position);light.SetFocalPoint(-12,8,0);light.SetIntensity(power);renderer.AddLight(light)
def mat(a):
 m=vtk.vtkMatrix4x4();[m.SetElement(i,j,float(a[i,j])) for i in range(4) for j in range(4)];return m
def as4(R,p):
 m=np.eye(4);m[:3,:3]=R;m[:3,3]=p;return m
def actor(mesh):
 poly=vtk.vtkPolyData();pts=vtk.vtkPoints();pts.SetData(numpy_to_vtk(mesh.vertices.astype('float32')));poly.SetPoints(pts)
 faces=mesh.faces.astype(np.int64);offsets=np.arange(len(faces)+1,dtype=np.int64)*3
 carr=vtk.vtkCellArray();carr.SetData(numpy_to_vtkIdTypeArray(offsets,deep=True),numpy_to_vtkIdTypeArray(faces.ravel(),deep=True));poly.SetPolys(carr)
 mapper=vtk.vtkPolyDataMapper();mapper.SetInputData(poly);mapper.ScalarVisibilityOff()
 a=vtk.vtkActor();a.SetMapper(mapper)
 c=mesh.visual.face_colors[0][:3];a.GetProperty().SetColor(*(v/255 for v in c));a.GetProperty().SetAmbient(.19);a.GetProperty().SetSpecular(.25);a.GetProperty().SetSpecularPower(32)
 return a
actors={}
for n in scene.graph.nodes_geometry:
 transform,g=scene.graph[n];a=actor(scene.geometry[g]);a.SetUserMatrix(mat(transform));renderer.AddActor(a);actors[n]=a
cam=renderer.GetActiveCamera();focal=np.array([-9.,8.,12.]);cam.SetFocalPoint(*focal);cam.SetViewUp(0,0,1);cam.ParallelProjectionOn();cam.SetParallelScale(93)
toim=vtk.vtkWindowToImageFilter();toim.SetInput(win);toim.ReadFrontBufferOff();toim.SetInputBufferTypeToRGB()
base=B;length=THUMB['proximal'];ip_max=THUMB['opposed']['ip_deg']
def move(f,q,ip):
 for d in DIGITS:
  p0=np.array([d['base_x'],0.,d['z']]);p=p0.copy();popen=p0.copy();total=0
  for i,L in enumerate(d['lengths']):
   total+=np.array([80.,77.4,59.7])[i]*f;R=Rz(total)
   actors[d['name']+'_'+['prox','middle','dist'][i]].SetUserMatrix(mat(as4(R,p-R@popen)))
   p=p+R@np.array([L,0,0]);popen=popen+np.array([L,0,0]);
 Rc=Rot.from_rotvec(q*ROT_VEC).as_matrix()@R_OPEN
 Rp=Rc@R_OPEN.T
 proximal_pivot=base+6*A
 actors['thumb_prox'].SetUserMatrix(mat(as4(Rp,proximal_pivot-Rp@proximal_pivot)))
 for nm,origin in [('thumb_rotor',B),('servo_horn',C),('link_pin_thumb',B),('link_pin_servo',C)]:
  if nm in actors: actors[nm].SetUserMatrix(mat(as4(Rp,origin-Rp@origin)))
 if 'link_rod' in actors:
  off=(Rp@U-U)*RCRANK
  actors['link_rod'].SetUserMatrix(mat(as4(np.eye(3),off)))
 open_joint=base+6*A+R_OPEN@np.array([length,0.,0.])
 joint=base+6*A+Rc@np.array([length,0.,0.])
 Rd=Rc@Rz(ip*ip_max);Rrelative=Rd@R_OPEN.T
 actors['thumb_dist'].SetUserMatrix(mat(as4(Rrelative,joint-Rrelative@open_joint)))

def blend(x):
 x=max(0.,min(1.,x));return x*x*(3-2*x)

def validate_animation_transforms():
 # Check the ACTUAL VTK actor matrices against independent CAD kinematic landmarks.
 errors=[]
 def moved(n,p):
  matrix=actors[n].GetMatrix()
  m=np.array([[matrix.GetElement(i,j) for j in range(4)] for i in range(4)])
  return (m@np.r_[p,1.])[:3]
 for f,q,ip in [(0,0,0),(.1,.25,0),(.1,.5,0),(.1,.75,0),(.1,1,0),(.63,1,1),(1,.5,.4)]:
  move(f,q,ip)
  _,cad=thumb_pose(q,ip)
  pivot=B+6*A
  open_joint=pivot+R_OPEN@np.array([33.,0,0])
  open_tip=pivot+R_OPEN@np.array([58.,0,0])
  errors.extend([np.linalg.norm(moved('thumb_prox',pivot)-pivot),
    np.linalg.norm(moved('thumb_prox',open_joint)-cad['proximal_joint']),
    np.linalg.norm(moved('thumb_dist',open_tip)-cad['tip'])])
  Q=Rot.from_rotvec(q*ROT_VEC).as_matrix()
  rod0=C+8.7*A+U*RCRANK;rodq=C+8.7*A+(Q@U)*RCRANK
  errors.append(np.linalg.norm(moved('link_rod',rod0)-rodq))
  for d in DIGITS:
   tip0=np.array([d['base_x']+sum(d['lengths']),0.,d['z']])
   _,tip=finger_solid_parts(d,f)
   errors.append(np.linalg.norm(moved(d['name']+'_dist',tip0)-tip))
 result={'version':'v0.5c-archive-review-r1','poses':7,'landmark_comparisons':len(errors),
         'maximum_error_mm':float(max(errors)),'tolerance_mm':1e-7,
         'status':'PASS' if max(errors)<1e-7 else 'FAIL',
         'scope':'rendered rigid transforms vs CAD kinematic landmarks, not hardware'}
 (ROOT/'animation_transform_check.json').write_text(json.dumps(result,indent=2))
 assert result['status']=='PASS',result
 move(0,0,0)
 print('TRANSFORMS',result,flush=True)
 return result
def poses(t):
 # Each commanded phase lasts 1.5s; this is prescribed animation, not motor validation.
 if t<.5:return 0.,0.,0.,'ИСХОДНОЕ ПОЛОЖЕНИЕ • палец отведён наружу'
 if t<2.0:
  a=blend((t-.5)/1.5);return .1*a,a,0.,'ПРОТИВОПОСТАВЛЕНИЕ • наклонный поворотный сустав'
 if t<3.5:
  a=blend((t-2)/1.5);return .1+(.63-.1)*a,1.,a,'ТОЧНЫЙ ХВАТ • сгибание большого пока задано программно'
 if t<5.0:
  a=blend((t-3.5)/1.5);return .63-(.63-.1)*a,1.,1.-a,'ОТКРЫТИЕ ХВАТА • освобождение предмета'
 if t<6.5:
  a=blend((t-5)/1.5);return .1,1.-.5*a,.4*a,'ПЕРЕСТАНОВКА • большой палец отходит наружу'
 if t<8.0:
  a=blend((t-6.5)/1.5);return .1+.9*a,.5,.4,'ЗАКРЫТИЕ КУЛАКА • большой палец снаружи'
 if t<9.5:
  a=blend((t-8)/1.5);return 1.-a,.5,.4,'РАЗГИБАНИЕ • заданный ход 1,5 с'
 a=blend((t-9.5)/1.5);return 0.,.5*(1.-a),.4*(1.-a),'ОБЗОР ИСПРАВЛЕННОГО ДВИЖЕНИЯ'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',19)
subfont=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
def render(t):
 f,q,ip,caption=poses(t);move(f,q,ip)
 az=np.deg2rad(20+20*blend((t-9.5)/1.5))
 cam.SetPosition(*(focal+np.array([70+28*np.sin(az),210*np.cos(az),125.])))
 renderer.ResetCameraClippingRange();win.Render();toim.Modified();toim.Update()
 arr=vtk_to_numpy(toim.GetOutput().GetPointData().GetScalars()).reshape(H,W,3)[::-1]
 im=Image.fromarray(np.ascontiguousarray(arr),'RGB')
 d=ImageDraw.Draw(im,'RGBA')
 d.rounded_rectangle((13,12,W-13,72),radius=13,fill=(255,255,255,235))
 d.text((29,20),'БИОНИЧЕСКАЯ КИСТЬ • v0.5c-archive-review-r1 • ПРОВЕРКА CAD',font=font,fill=(24,48,69))
 d.text((29,50),'Поворот: номинальный MG90S + параллелограмм. Отдельный привод сгибания ещё не размещён.',font=subfont,fill=(83,102,120))
 d.rounded_rectangle((13,H-87,W-13,H-13),radius=13,fill=(255,255,255,237))
 d.text((28,H-80),caption,font=font,fill=(24,66,92))
 d.text((28,H-49),'CAD-анимация: 1,5 с задано программно. Прочность, 10 кг, ЭМГ и защита от воды НЕ проверены.',font=subfont,fill=(158,60,65))
 d.text((28,H-27),f'Фаза: пальцы {f*100:.0f}% · поворот большого {q*100:.0f}% · дистальная фаланга {ip*100:.0f}%',font=subfont,fill=(91,98,107))
 return im
if __name__=='__main__':
 validate_animation_transforms()
 out=ROOT/'thumb_motor_v05c.mp4';gif=ROOT/'thumb_motor_v05c_preview.gif'
 ffmpeg=subprocess.Popen(['ffmpeg','-nostats','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-vcodec','libx264','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],stdin=subprocess.PIPE)
 small=[]
 for i in range(int(11.0*FPS)):
  im=render(i/FPS);ffmpeg.stdin.write(np.asarray(im).tobytes())
  if i%5==0:small.append(im.resize((650,425)))
  if i==20:im.save(ROOT/'thumb_motor_v05c_swing.png')
  if i==34:im.save(ROOT/'thumb_motor_v05c_pinch.png')
  if i==79:im.save(ROOT/'thumb_motor_v05c_power.png')
  if i%30==0:print('render',i,flush=True)
 ffmpeg.stdin.close();ret=ffmpeg.wait();assert ret==0
 small[0].save(gif,save_all=True,append_images=small[1:],duration=int(1000*5/FPS),loop=0,optimize=True)
 print('VIDEO',out,out.stat().st_size,'GIF',gif.stat().st_size)
