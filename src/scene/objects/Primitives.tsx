"use client";
import { Capsule, RoundedBox, Text, useCursor, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense,useEffect,useLayoutEffect,useMemo,useRef,useState,type RefObject } from "react";
import * as THREE from "three";
import { PALETTE as C } from "../constants";
import { withSceneBasePath } from "../camera/sceneRoutes";
import { CERTIFICATES, CERTIFICATE_LAYOUT, type CertificateRecord } from "./certificates";
import { PHONE_LAYOUT } from "../sceneLayout";
import type { PoemRecord } from "../content/poems";
import type { PoemsContentState } from "../content/usePoems";

const mat = { roughness: .82, metalness: 0 };
const MACBOOK_CHASSIS_MATERIAL=new THREE.MeshStandardMaterial({color:"#55585a",roughness:.46,metalness:.24});
const MACBOOK_DARK_MATERIAL=new THREE.MeshStandardMaterial({color:"#090b0c",roughness:.72,metalness:.05});
const MACBOOK_TRACKPAD_MATERIAL=new THREE.MeshStandardMaterial({color:"#5e6163",roughness:.54,metalness:.16});
const MACBOOK_PLANE_GEOMETRY=new THREE.PlaneGeometry(1,1);
const MACBOOK_HINGE_GEOMETRY=new THREE.CylinderGeometry(.026,.026,1.18,8,1,false);
const DESK_LAMP_METAL_MATERIAL=new THREE.MeshStandardMaterial({color:"#292a29",roughness:.52,metalness:.34});
const DESK_LAMP_BRASS_MATERIAL=new THREE.MeshStandardMaterial({color:"#766047",roughness:.46,metalness:.58});
const DESK_LAMP_DIFFUSER_MATERIAL=new THREE.MeshStandardMaterial({color:"#d9b483",roughness:.72,metalness:0,emissive:"#ff9c4a",emissiveIntensity:.58});
const DESK_LAMP_BASE_GEOMETRY=new THREE.CylinderGeometry(.28,.3,.065,16,1,false);
const DESK_LAMP_BASE_INSET_GEOMETRY=new THREE.CylinderGeometry(.19,.22,.016,12,1,false);
const DESK_LAMP_ARM_GEOMETRY=new THREE.CylinderGeometry(.022,.025,1,8,1,false);
const DESK_LAMP_JOINT_GEOMETRY=new THREE.CylinderGeometry(.055,.055,.034,10,1,false);
const DESK_LAMP_HEAD_GEOMETRY=new THREE.CylinderGeometry(.105,.17,.205,16,1,true);
const DESK_LAMP_COLLAR_GEOMETRY=new THREE.CylinderGeometry(.047,.052,.12,10,1,false);
const DESK_LAMP_DIFFUSER_GEOMETRY=new THREE.CircleGeometry(.154,16);
const IPHONE_FRAME_MATERIAL=new THREE.MeshStandardMaterial({color:"#242728",roughness:.38,metalness:.62});
const IPHONE_BACK_MATERIAL=new THREE.MeshStandardMaterial({color:"#0b0d0e",roughness:.34,metalness:.12});
const IPHONE_GLASS_MATERIAL=new THREE.MeshStandardMaterial({color:"#010203",roughness:.16,metalness:.04});
const IPHONE_FLASH_MATERIAL=new THREE.MeshStandardMaterial({color:"#d4cec0",roughness:.68,metalness:0});
const IPHONE_BODY_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(.325,.65,.057),{depth:.026,steps:1,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:.004,bevelThickness:.004});
IPHONE_BODY_GEOMETRY.center();IPHONE_BODY_GEOMETRY.rotateX(-Math.PI/2);IPHONE_BODY_GEOMETRY.computeVertexNormals();
const IPHONE_SCREEN_GEOMETRY=new THREE.ShapeGeometry(roundedRectangleShape(.299,.618,.047),2);
IPHONE_SCREEN_GEOMETRY.rotateX(-Math.PI/2);
const IPHONE_SCREEN_IMAGE_GEOMETRY=IPHONE_SCREEN_GEOMETRY.clone();
{
  const positions=IPHONE_SCREEN_IMAGE_GEOMETRY.getAttribute("position");
  const uvs=new Float32Array(positions.count*2);
  for(let index=0;index<positions.count;index++){
    uvs[index*2]=positions.getX(index)/.299+.5;
    uvs[index*2+1]=.5-positions.getZ(index)/.618;
  }
  IPHONE_SCREEN_IMAGE_GEOMETRY.setAttribute("uv",new THREE.BufferAttribute(uvs,2));
}
const IPHONE_BACK_GEOMETRY=new THREE.ShapeGeometry(roundedRectangleShape(.305,.63,.05),2);
IPHONE_BACK_GEOMETRY.rotateX(Math.PI/2);
const IPHONE_CAMERA_ISLAND_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(.135,.135,.03),{depth:.006,steps:1,curveSegments:2,bevelEnabled:false});
IPHONE_CAMERA_ISLAND_GEOMETRY.center();IPHONE_CAMERA_ISLAND_GEOMETRY.rotateX(Math.PI/2);IPHONE_CAMERA_ISLAND_GEOMETRY.computeVertexNormals();
const IPHONE_DYNAMIC_ISLAND_GEOMETRY=new THREE.ShapeGeometry(roundedRectangleShape(.105,.025,.0125),1);
IPHONE_DYNAMIC_ISLAND_GEOMETRY.rotateX(-Math.PI/2);
const IPHONE_LENS_GEOMETRY=new THREE.CylinderGeometry(.026,.026,.004,8,1,false);
const IPHONE_FLASH_GEOMETRY=new THREE.CircleGeometry(.011,8);
const IPHONE_SCREEN_TEXTURE_REPEAT_X=(.299/.618)/(675/1200);
const PHONE_CONTACT_URL="https://wa.me/+593964198839";
const ZZ_LEAF_DARK_MATERIAL=new THREE.MeshStandardMaterial({color:"#334f36",roughness:.8,metalness:0,side:THREE.DoubleSide});
const ZZ_LEAF_LIGHT_MATERIAL=new THREE.MeshStandardMaterial({color:"#405f3d",roughness:.76,metalness:0,side:THREE.DoubleSide});
const ZZ_POT_MATERIAL=new THREE.MeshStandardMaterial({color:"#927b67",roughness:.8,metalness:0});
const ZZ_SOIL_MATERIAL=new THREE.MeshStandardMaterial({color:"#241a14",roughness:1,metalness:0});
const ZZ_STEM_GEOMETRY=new THREE.CylinderGeometry(.012,.016,1,5,1,false);
const ZZ_POT_GEOMETRY=new THREE.LatheGeometry([
  new THREE.Vector2(.17,-.11),new THREE.Vector2(.183,-.105),new THREE.Vector2(.192,-.09),
  new THREE.Vector2(.222,.23),new THREE.Vector2(.235,.275),new THREE.Vector2(.252,.29),
  new THREE.Vector2(.255,.305),new THREE.Vector2(.248,.318),new THREE.Vector2(.225,.325),
  new THREE.Vector2(.212,.314),new THREE.Vector2(.208,.29),
],12);
const ZZ_LEAF_GEOMETRY=new THREE.BufferGeometry();
ZZ_LEAF_GEOMETRY.setAttribute("position",new THREE.BufferAttribute(new Float32Array([
  0,0,0,
  -.035,.09,.002,.035,.09,.002,
  -.065,.2,.012,.065,.2,.012,
  -.045,.32,.032,.045,.32,.032,
  0,.42,.06,
]),3));
ZZ_LEAF_GEOMETRY.setIndex([0,2,1,1,2,4,1,4,3,3,4,6,3,6,5,5,6,7]);
ZZ_LEAF_GEOMETRY.computeVertexNormals();
const ZZ_STEMS=[
  {x:-.07,z:.015,height:.88,leanX:-.12,leanZ:.025,angle:2.8},
  {x:.045,z:-.025,height:1.02,leanX:.075,leanZ:-.04,angle:.18},
  {x:-.015,z:.055,height:.78,leanX:.035,leanZ:.11,angle:1.35},
  {x:.09,z:.04,height:.9,leanX:.14,leanZ:.055,angle:.55},
  {x:-.1,z:-.045,height:.74,leanX:-.15,leanZ:-.08,angle:-2.35},
] as const;
const CHAIR_FRAME_MATERIAL=new THREE.MeshStandardMaterial({color:"#1d2021",roughness:.68,metalness:.08});
const CHAIR_FABRIC_MATERIAL=new THREE.MeshStandardMaterial({color:"#292827",roughness:.94,metalness:0,side:THREE.DoubleSide});
const CHAIR_BACKING_MATERIAL=new THREE.MeshStandardMaterial({color:"#343638",roughness:.86,metalness:0,side:THREE.DoubleSide});
const CHAIR_METAL_MATERIAL=new THREE.MeshStandardMaterial({color:"#4a4c4c",roughness:.42,metalness:.58});
const CHAIR_BACK_FRAME_SHAPE=roundedRectangleShape(1.12,1.52,.18);
CHAIR_BACK_FRAME_SHAPE.holes.push(roundedRectangleHole(.91,1.29,.12));
const CHAIR_BACK_FRAME_GEOMETRY=new THREE.ExtrudeGeometry(CHAIR_BACK_FRAME_SHAPE,{depth:.045,steps:1,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:.012,bevelThickness:.012});
CHAIR_BACK_FRAME_GEOMETRY.center();CHAIR_BACK_FRAME_GEOMETRY.computeVertexNormals();
const CHAIR_BACK_PANEL_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(.9,1.28,.12),{depth:.025,steps:1,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:.012,bevelThickness:.012});
CHAIR_BACK_PANEL_GEOMETRY.center();CHAIR_BACK_PANEL_GEOMETRY.computeVertexNormals();
const CHAIR_BACK_MESH_GEOMETRY=new THREE.BufferGeometry();
CHAIR_BACK_MESH_GEOMETRY.setAttribute("position",new THREE.BufferAttribute(new Float32Array([
  -.38,-.64,0,.38,-.64,0,
  -.44,-.23,.04,.44,-.23,.04,
  -.44,.2,.06,.44,.2,.06,
  -.42,.64,.02,.42,.64,.02,
]),3));
CHAIR_BACK_MESH_GEOMETRY.setIndex([0,1,3,0,3,2,2,3,5,2,5,4,4,5,7,4,7,6]);
CHAIR_BACK_MESH_GEOMETRY.computeVertexNormals();
const CHAIR_SEAT_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(1.13,.98,.17),{depth:.12,steps:1,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:.025,bevelThickness:.025});
CHAIR_SEAT_GEOMETRY.center();CHAIR_SEAT_GEOMETRY.rotateX(-Math.PI/2);CHAIR_SEAT_GEOMETRY.computeVertexNormals();
const CHAIR_ARM_PAD_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(.38,.11,.05),{depth:.055,steps:1,curveSegments:1,bevelEnabled:true,bevelSegments:1,bevelSize:.012,bevelThickness:.012});
CHAIR_ARM_PAD_GEOMETRY.center();CHAIR_ARM_PAD_GEOMETRY.rotateX(-Math.PI/2);CHAIR_ARM_PAD_GEOMETRY.computeVertexNormals();
const CHAIR_ARM_SUPPORT_GEOMETRY=new THREE.CylinderGeometry(.035,.045,.52,6,1,false);
const CHAIR_BASE_ARM_GEOMETRY=new THREE.BoxGeometry(1,.07,.09);
const CHAIR_CASTER_FORK_GEOMETRY=new THREE.BoxGeometry(.07,.1,.055);
const CHAIR_CASTER_GEOMETRY=new THREE.CylinderGeometry(.065,.065,.045,8,1,false);
const CHAIR_GAS_LIFT_GEOMETRY=new THREE.CylinderGeometry(.04,.05,.5,8,1,false);
const CHAIR_GAS_COLLAR_GEOMETRY=new THREE.CylinderGeometry(.075,.09,.17,8,1,false);
const CHAIR_HUB_GEOMETRY=new THREE.CylinderGeometry(.12,.14,.1,10,1,false);
const CHAIR_SPINE_GEOMETRY=new THREE.CylinderGeometry(.026,.032,.7,6,1,false);
const CHAIR_LUMBAR_GEOMETRY=new THREE.CylinderGeometry(.025,.025,.66,6,1,false);
const MUG_CERAMIC_MATERIAL=new THREE.MeshStandardMaterial({color:"#6f211d",roughness:.72,metalness:0});
const MUG_COFFEE_MATERIAL=new THREE.MeshStandardMaterial({color:"#170b07",roughness:.24,metalness:.02});
const MUG_BODY_GEOMETRY=new THREE.LatheGeometry([
  new THREE.Vector2(.12,-.17),new THREE.Vector2(.14,-.16),new THREE.Vector2(.15,-.13),
  new THREE.Vector2(.158,.12),new THREE.Vector2(.16,.155),new THREE.Vector2(.155,.17),
  new THREE.Vector2(.137,.17),new THREE.Vector2(.132,.155),new THREE.Vector2(.13,.13),
],12);
const MUG_HANDLE_GEOMETRY=new THREE.TubeGeometry(new THREE.CubicBezierCurve3(
  new THREE.Vector3(0,.105,0),new THREE.Vector3(.2,.11,0),new THREE.Vector3(.2,-.11,0),new THREE.Vector3(0,-.105,0),
),8,.026,4,false);
const MUG_COFFEE_GEOMETRY=new THREE.CircleGeometry(.129,12);
const STEAM_DATA=new Uint8Array(16*32*4);
for(let y=0;y<32;y++)for(let x=0;x<16;x++){
  const index=(y*16+x)*4,nx=(x-7.5)/7.5,ny=y/31;
  const wispy=Math.exp(-nx*nx*5.4)*Math.pow(Math.sin(Math.PI*ny),1.25)*(.68+.32*Math.sin(x*1.7+y*.63));
  STEAM_DATA[index]=225;STEAM_DATA[index+1]=220;STEAM_DATA[index+2]=214;STEAM_DATA[index+3]=Math.max(0,Math.round(wispy*150));
}
const STEAM_TEXTURE=new THREE.DataTexture(STEAM_DATA,16,32,THREE.RGBAFormat);
STEAM_TEXTURE.minFilter=THREE.LinearFilter;STEAM_TEXTURE.magFilter=THREE.LinearFilter;STEAM_TEXTURE.generateMipmaps=false;STEAM_TEXTURE.needsUpdate=true;
const PORTFOLIO_LEATHER_MATERIAL=new THREE.MeshStandardMaterial({color:"#38231a",roughness:.8,metalness:0});
const PORTFOLIO_LINING_MATERIAL=new THREE.MeshStandardMaterial({color:"#211b18",roughness:.92,metalness:0});
const PORTFOLIO_PAPER_MATERIAL=new THREE.MeshStandardMaterial({color:"#d8ceb9",roughness:.92,metalness:0});
const PORTFOLIO_METAL_MATERIAL=new THREE.MeshStandardMaterial({color:"#7a7771",roughness:.38,metalness:.72});
const PORTFOLIO_TURNED_PAGE_DIM_COLOR=new THREE.Color("#15110d");
const PORTFOLIO_TURNED_PAGE_ACTIVE_COLOR=new THREE.Color("#e6dcc7");
const PORTFOLIO_COVER_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(.84,.78,.055),{depth:.045,steps:1,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:.01,bevelThickness:.01});
PORTFOLIO_COVER_GEOMETRY.center();PORTFOLIO_COVER_GEOMETRY.rotateX(-Math.PI/2);PORTFOLIO_COVER_GEOMETRY.computeVertexNormals();
const PORTFOLIO_LINING_GEOMETRY=new THREE.ShapeGeometry(roundedRectangleShape(.77,.71,.045),1);
PORTFOLIO_LINING_GEOMETRY.rotateX(-Math.PI/2);
const PORTFOLIO_POCKET_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(.68,.5,.04),{depth:.014,steps:1,curveSegments:1,bevelEnabled:true,bevelSegments:1,bevelSize:.006,bevelThickness:.006});
PORTFOLIO_POCKET_GEOMETRY.center();PORTFOLIO_POCKET_GEOMETRY.rotateX(-Math.PI/2);PORTFOLIO_POCKET_GEOMETRY.computeVertexNormals();
const PORTFOLIO_PAGE_GEOMETRY=new THREE.ExtrudeGeometry(roundedRectangleShape(.72,.7,.025),{depth:.007,steps:1,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:.003,bevelThickness:.003});
PORTFOLIO_PAGE_GEOMETRY.center();PORTFOLIO_PAGE_GEOMETRY.rotateX(-Math.PI/2);PORTFOLIO_PAGE_GEOMETRY.computeVertexNormals();
const PORTFOLIO_PAGE_SURFACE_GEOMETRY=new THREE.PlaneGeometry(.704,.682);
const PORTFOLIO_RING_GEOMETRY=new THREE.TorusGeometry(.032,.007,4,8,Math.PI*1.75);
// Small washers make the paper-to-ring connection legible at the close reading shot.
// They sit on the top sheet only; the real binding is carried by the low-poly torus rings.
const PORTFOLIO_EYELET_GEOMETRY=new THREE.CylinderGeometry(.014,.014,.003,8,1,false);
const PORTFOLIO_STITCH_GEOMETRY=new THREE.BoxGeometry(.035,.003,.006);
const PORTFOLIO_PEN_LOOP_GEOMETRY=new THREE.TorusGeometry(.026,.008,4,8);
const PORTFOLIO_ZIPPER_CURVE=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-.78,.011,-.41),new THREE.Vector3(.78,.011,-.41),new THREE.Vector3(.86,.011,-.34),new THREE.Vector3(.86,.011,.34),
  new THREE.Vector3(.78,.011,.41),new THREE.Vector3(-.78,.011,.41),new THREE.Vector3(-.86,.011,.34),new THREE.Vector3(-.86,.011,-.34),
],true,"catmullrom",.1);
const PORTFOLIO_ZIPPER_GEOMETRY=new THREE.TubeGeometry(PORTFOLIO_ZIPPER_CURVE,48,.006,3,true);
const PORTFOLIO_POLAROID_GEOMETRY=new THREE.BoxGeometry(.34,.008,.4);
const PORTFOLIO_PHOTO_GEOMETRY=new THREE.PlaneGeometry(.27,.285);
const PORTFOLIO_SLOT_GEOMETRY=new THREE.BoxGeometry(.32,.01,.045);
const PORTFOLIO_PULL_GEOMETRY=new THREE.BoxGeometry(.06,.012,.026);
const PORTFOLIO_PAGE_TURN_GEOMETRY=new THREE.PlaneGeometry(.2,.15);
const ARCHITECTURAL_WOOD_MATERIAL=new THREE.MeshStandardMaterial({color:"#39271d",roughness:.78,metalness:0,vertexColors:true});
const ARCHITECTURAL_PANEL_GEOMETRY=new THREE.BoxGeometry(1,1,1);
const ARCHITECTURAL_BASEBOARD_GEOMETRY=(()=>{
  const crossSection:[[number,number],[number,number],[number,number],[number,number],[number,number]]=[
    [0,0],[0,.05],[.09,.05],[.105,.037],[.105,0],
  ];
  const positions:number[]=[];
  for(const x of [-.5,.5])for(const [y,z] of crossSection)positions.push(x,y,z);
  const indices:number[]=[];
  for(let index=0;index<crossSection.length;index++){
    const next=(index+1)%crossSection.length;
    indices.push(index,next,5+next,index,5+next,5+index);
  }
  indices.push(0,2,1,0,3,2,0,4,3,5,6,7,5,7,8,5,8,9);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return geometry;
})();

function roundedRectangleShape(width:number,height:number,radius:number){
  const x=-width/2,y=-height/2,shape=new THREE.Shape();
  shape.moveTo(x+radius,y);
  shape.lineTo(x+width-radius,y);shape.quadraticCurveTo(x+width,y,x+width,y+radius);
  shape.lineTo(x+width,y+height-radius);shape.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);
  shape.lineTo(x+radius,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-radius);
  shape.lineTo(x,y+radius);shape.quadraticCurveTo(x,y,x+radius,y);
  return shape;
}

function roundedRectangleHole(width:number,height:number,radius:number){
  const x=-width/2,y=-height/2,path=new THREE.Path();
  path.moveTo(x+radius,y);path.quadraticCurveTo(x,y,x,y+radius);
  path.lineTo(x,y+height-radius);path.quadraticCurveTo(x,y+height,x+radius,y+height);
  path.lineTo(x+width-radius,y+height);path.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
  path.lineTo(x+width,y+radius);path.quadraticCurveTo(x+width,y,x+width-radius,y);
  path.lineTo(x+radius,y);
  return path;
}

function useMacBookShellGeometry(width:number,height:number,depth:number,radius:number,bevel:number){
  const geometry=useMemo(()=>{
    const result=new THREE.ExtrudeGeometry(roundedRectangleShape(width,height,radius),{depth,steps:1,curveSegments:2,bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel});
    result.center();result.computeVertexNormals();
    return result;
  },[width,height,depth,radius,bevel]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return geometry;
}

export function Room() { return <group>
  <mesh rotation-x={-Math.PI/2} receiveShadow><planeGeometry args={[18,15]}/><meshStandardMaterial color={C.floor} {...mat}/></mesh>
  <mesh position={[0,4,-4]} receiveShadow><planeGeometry args={[18,8]}/><meshStandardMaterial color={C.wall} {...mat}/></mesh>
  <mesh position={[-6,4,0]} rotation-y={Math.PI/2} receiveShadow><planeGeometry args={[8,8]}/><meshStandardMaterial color="#303239" {...mat}/></mesh>
  <mesh position={[5.85,4,0]} rotation-y={-Math.PI/2} receiveShadow><planeGeometry args={[8,8]}/><meshStandardMaterial color="#29292b" {...mat}/></mesh>
  <mesh position={[0,8,0]} rotation-x={Math.PI/2}><planeGeometry args={[18,15]}/><meshStandardMaterial color="#24221f" {...mat}/></mesh>
  <mesh position={[-5.94,3.65,-.7]} rotation-y={Math.PI/2}><planeGeometry args={[3.3,3.8]}/><meshStandardMaterial color="#151a20" roughness={.5}/></mesh>
  <ArchitecturalWoodwork/>
</group> }

function ArchitecturalWoodwork(){
  const baseboardsRef=useRef<THREE.InstancedMesh>(null),panelsRef=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const baseboards=baseboardsRef.current,panels=panelsRef.current;
    if(!baseboards||!panels)return;
    const dummy=new THREE.Object3D();
    const baseboardTransforms=[
      {position:[-.075,0,-3.995],rotation:0,scale:[11.85,1,1]},
      {position:[-5.995,0,1.75],rotation:Math.PI/2,scale:[11.5,1,1]},
      {position:[5.845,0,1.75],rotation:-Math.PI/2,scale:[11.5,1,1]},
      {position:[0,2.055,-3.95],rotation:0,scale:[5.62,.28,.7]},
    ] as const;
    baseboardTransforms.forEach(({position,rotation,scale},index)=>{
      dummy.position.set(...position);dummy.rotation.set(0,rotation,0);dummy.scale.set(...scale);dummy.updateMatrix();baseboards.setMatrixAt(index,dummy.matrix);
    });
    const panelColors=["#3b291e","#36241b","#402c20","#39271d","#3d2a1f","#35241b","#3f2b20"];
    panelColors.forEach((color,index)=>{
      dummy.position.set((index-3)*.8,1.08,-3.975);dummy.rotation.set(0,0,0);dummy.scale.set(.786,1.94,.04);dummy.updateMatrix();panels.setMatrixAt(index,dummy.matrix);
      panels.setColorAt(index,new THREE.Color(color));
    });
    [baseboards,panels].forEach((mesh)=>{mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();});
    if(panels.instanceColor)panels.instanceColor.needsUpdate=true;
  },[]);
  return <group dispose={null}>
    <instancedMesh ref={baseboardsRef} args={[ARCHITECTURAL_BASEBOARD_GEOMETRY,ARCHITECTURAL_WOOD_MATERIAL,4]} castShadow receiveShadow/>
    <instancedMesh ref={panelsRef} args={[ARCHITECTURAL_PANEL_GEOMETRY,ARCHITECTURAL_WOOD_MATERIAL,7]} castShadow receiveShadow/>
  </group>;
}

export function Desk() { return <group position={[0,0,-1.5]}>
  <RoundedBox args={[5.5,.18,2.2]} radius={.08} position={[0,1.15,0]} castShadow receiveShadow><meshStandardMaterial color={C.wood} roughness={.66}/></RoundedBox>
  {[-2.35,2.35].flatMap(x=>[-.75,.75].map(z=><mesh key={`${x}${z}`} position={[x,.56,z]} castShadow><boxGeometry args={[.13,1.12,.13]}/><meshStandardMaterial color={C.metal} metalness={.65} roughness={.34}/></mesh>))}
  <Drawer />
</group> }

function Drawer() { return <group position={[1.72,.68,0]}>
  <RoundedBox args={[1.5,.72,1.72]} radius={.04} castShadow><meshStandardMaterial color={C.woodEdge} roughness={.72}/></RoundedBox>
  {[.86,.62].map((y)=><group key={y}><mesh position={[0,y-.68,.87]}><boxGeometry args={[1.37,.19,.04]}/><meshStandardMaterial color={C.wood}/></mesh><mesh position={[0,y-.68,.91]}><boxGeometry args={[.28,.035,.05]}/><meshStandardMaterial color={C.metal} metalness={.8}/></mesh></group>)}
</group> }

export function Laptop({position,rotation}:{position:[number,number,number];rotation:number}) {
  const bodyGeometry=useMacBookShellGeometry(1.72,1.04,.044,.075,.006);
  const lidGeometry=useMacBookShellGeometry(1.7,.99,.022,.07,.005);
  return <group position={[position[0],1.24+position[1],-1.5+position[2]]} rotation-y={THREE.MathUtils.degToRad(rotation)} dispose={null}>
    <mesh geometry={bodyGeometry} position={[0,.028,0]} rotation-x={-Math.PI/2} castShadow receiveShadow>
      <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={MACBOOK_PLANE_GEOMETRY} scale={[1.35,.5,1]} position={[0,.058,-.15]} rotation-x={-Math.PI/2}>
      <primitive object={MACBOOK_DARK_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={MACBOOK_PLANE_GEOMETRY} scale={[.62,.31,1]} position={[0,.0585,.31]} rotation-x={-Math.PI/2}>
      <primitive object={MACBOOK_TRACKPAD_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={MACBOOK_HINGE_GEOMETRY} position={[0,.061,-.49]} rotation-z={Math.PI/2} castShadow>
      <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material"/>
    </mesh>
    <group position={[0,.061,-.49]} rotation-x={THREE.MathUtils.degToRad(-13)}>
      <mesh geometry={lidGeometry} position={[0,.495,0]} castShadow>
        <primitive object={MACBOOK_CHASSIS_MATERIAL} attach="material"/>
      </mesh>
      <mesh geometry={MACBOOK_PLANE_GEOMETRY} scale={[1.57,.86,1]} position={[0,.495,.017]}>
        <primitive object={MACBOOK_DARK_MATERIAL} attach="material"/>
      </mesh>
    </group>
  </group>;
}

export function DeskObjects({coffeePosition,lampPosition,folderPosition,folderRotation,paperPosition,paperRotation,penPosition,penRotation,phoneActive,poemsActive,poemsContent,activePoemSlug,onPoemSelect}:{coffeePosition:[number,number,number];lampPosition:[number,number,number];folderPosition:[number,number];folderRotation:number;paperPosition:[number,number];paperRotation:number;penPosition:[number,number];penRotation:number;phoneActive:boolean;poemsActive:boolean;poemsContent:PoemsContentState;activePoemSlug:string|null;onPoemSelect:(slug:string)=>unknown}) { return <group position={[0,1.31,-1.5]}>
  <PaperAndPen position={paperPosition} rotation={paperRotation} penPosition={penPosition} penRotation={penRotation} />
  <Phone active={phoneActive}/>
  <PoemsPortfolio position={folderPosition} rotation={folderRotation} active={poemsActive} poemsContent={poemsContent} activePoemSlug={activePoemSlug} onPoemSelect={onPoemSelect}/>
  <Coffee position={coffeePosition}/>
  <DeskLamp position={lampPosition} />
</group> }

function PortfolioPhoto({materialRef}:{materialRef:RefObject<THREE.MeshStandardMaterial|null>}){
  const photo=useTexture(withSceneBasePath("/pinscher.png"));
  photo.colorSpace=THREE.SRGBColorSpace;photo.anisotropy=8;
  return <mesh geometry={PORTFOLIO_PHOTO_GEOMETRY} position={[0,.0045,-.022]} rotation-x={-Math.PI/2}>
    <meshStandardMaterial ref={materialRef} map={photo} emissiveMap={photo} emissive="#ffffff" emissiveIntensity={0} color="#d2c9ba" roughness={.86} metalness={0}/>
  </mesh>;
}

function PortfolioPolaroid(){
  const [hovered,setHovered]=useState(false);
  const backingMaterialRef=useRef<THREE.MeshStandardMaterial>(null),photoMaterialRef=useRef<THREE.MeshStandardMaterial>(null);
  useCursor(hovered);
  useFrame((_,delta)=>{
    if(backingMaterialRef.current)backingMaterialRef.current.emissiveIntensity=THREE.MathUtils.damp(backingMaterialRef.current.emissiveIntensity,hovered?.13:0,5.5,delta);
    if(photoMaterialRef.current)photoMaterialRef.current.emissiveIntensity=THREE.MathUtils.damp(photoMaterialRef.current.emissiveIntensity,hovered?.15:0,5.5,delta);
  });
  return <group position={[-.445,.045,.045]} rotation-y={.09}
    onPointerOver={(event)=>{event.stopPropagation();setHovered(true);}}
    onPointerOut={()=>setHovered(false)}
    onClick={(event)=>{event.stopPropagation();window.open("https://www.instagram.com/misterpinscher/","_blank","noopener,noreferrer");}}>
    <mesh geometry={PORTFOLIO_POLAROID_GEOMETRY} castShadow>
      <meshStandardMaterial ref={backingMaterialRef} color="#d8ceb9" roughness={.92} metalness={0} emissive="#fff3df" emissiveIntensity={0}/>
    </mesh>
    <Suspense fallback={<mesh geometry={PORTFOLIO_PHOTO_GEOMETRY} position={[0,.0045,-.022]} rotation-x={-Math.PI/2}><meshStandardMaterial color="#272522" roughness={.9}/></mesh>}>
      <PortfolioPhoto materialRef={photoMaterialRef}/>
    </Suspense>
    <Suspense fallback={null}><Text position={[0,.0052,.163]} rotation-x={-Math.PI/2} fontSize={.027} letterSpacing={.012} font={withSceneBasePath("/fonts/PatrickHand-Regular.ttf")} anchorX="center" anchorY="middle">
      @misterpinscher
      <meshBasicMaterial color="#000000" toneMapped={false}/>
    </Text></Suspense>
  </group>;
}

const POEM_PAGE_FONT_SIZE=28;
const POEM_PAGE_BODY_TOP=184;
const POEM_PAGE_BODY_HEIGHT=820;

interface PoemPage {poem:PoemRecord;poemIndex:number;pageIndex:number;pageNumber:number;body:string;}

function wrapPoemLines(context:CanvasRenderingContext2D,body:string,fontSize:number,maxWidth:number){
  context.font=`${fontSize}px Georgia, "Times New Roman", serif`;
  const wrapped:string[]=[];
  for(const sourceLine of body.split("\n")){
    const words=sourceLine.trim().split(/\s+/).filter(Boolean);
    if(!words.length){wrapped.push("");continue;}
    let line="";
    for(const word of words){
      const candidate=line?`${line} ${word}`:word;
      if(line&&context.measureText(candidate).width>maxWidth){wrapped.push(line);line=word;}
      else line=candidate;
    }
    if(line)wrapped.push(line);
  }
  return wrapped;
}

function paginatePoem(poem:PoemRecord,poemIndex:number):PoemPage[]{
  const canvas=document.createElement("canvas");
  const context=canvas.getContext("2d");
  if(!context)return [{poem,poemIndex,pageIndex:0,pageNumber:1,body:poem.body}];
  const lines=wrapPoemLines(context,poem.body,POEM_PAGE_FONT_SIZE,868);
  const lineHeight=POEM_PAGE_FONT_SIZE*1.18;
  const blankLineHeight=POEM_PAGE_FONT_SIZE*.62;
  const linesPerPage=Math.max(1,Math.floor(POEM_PAGE_BODY_HEIGHT/lineHeight));
  const pages:PoemPage[]=[];
  let cursor=0,pageIndex=0;
  while(cursor<lines.length||pageIndex===0){
    let height=0,end=cursor;
    while(end<lines.length){
      const nextHeight=height+(lines[end]?lineHeight:blankLineHeight);
      if(end>cursor&&nextHeight>POEM_PAGE_BODY_HEIGHT)break;
      height=nextHeight;end+=1;
    }
    if(end===cursor)end=Math.min(cursor+linesPerPage,lines.length);
    pages.push({poem,poemIndex,pageIndex,pageNumber:pageIndex+1,body:lines.slice(cursor,end).join("\n")});
    cursor=end;pageIndex+=1;
  }
  return pages;
}

function createPoemPageTexture(page:PoemPage|null){
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=1160;
  const context=canvas.getContext("2d");if(!context)return null;
  context.fillStyle="#eee4cf";context.fillRect(0,0,canvas.width,canvas.height);
  context.textBaseline="top";context.fillStyle="#17130f";context.font='600 62px Georgia, "Times New Roman", serif';
  context.fillText(page?.poem.title??"Poems",78,72,868);
  context.fillStyle="#332a23";context.fillRect(78,150,54,2);
  if(page?.body){
    context.font=`${POEM_PAGE_FONT_SIZE}px Georgia, "Times New Roman", serif`;context.fillStyle="#211a15";
    let y=POEM_PAGE_BODY_TOP;
    for(const line of page.body.split("\n")){if(!line){y+=POEM_PAGE_FONT_SIZE*.62;continue;}context.fillText(line,78,y);y+=POEM_PAGE_FONT_SIZE*1.18;}
  }
  if(page){
    context.textAlign="right";context.fillStyle="#706356";context.font='22px Georgia, "Times New Roman", serif';
    context.fillText(`${page.poem.date}  ·  ${page.pageNumber}`,946,1090);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;texture.needsUpdate=true;return texture;
}

function usePoemPageTexture(page:PoemPage|null){
  const [texture,setTexture]=useState<THREE.CanvasTexture|null>(null);
  useEffect(()=>{
    const next=createPoemPageTexture(page);setTexture(next);
    return()=>next?.dispose();
  },[page?.poem.slug,page?.pageIndex,page?.body]);
  return texture;
}

function PoemPageTurn({position,label,onSelect}:{position:[number,number,number];label:string;onSelect:()=>void}){
  const [hovered,setHovered]=useState(false);
  useCursor(hovered);
  return <group position={position}
    onPointerOver={(event)=>{event.stopPropagation();setHovered(true);}}
    onPointerOut={()=>setHovered(false)}
    onClick={(event)=>{event.stopPropagation();onSelect();}}>
    <mesh geometry={PORTFOLIO_PAGE_TURN_GEOMETRY} rotation-x={-Math.PI/2}>
      <meshBasicMaterial transparent opacity={0} depthWrite={false}/>
    </mesh>
    <Suspense fallback={null}><Text rotation-x={-Math.PI/2} position={[0,.001,0]} fontSize={.042} font={withSceneBasePath("/fonts/PatrickHand-Regular.ttf")} anchorX="center" anchorY="middle">
      {label}<meshBasicMaterial color={hovered?"#17120f":"#51473d"} toneMapped={false}/>
    </Text></Suspense>
  </group>;
}

interface PortfolioPageTurnState {page:PoemPage;direction:-1|1;complete:boolean;}

function PortfolioPoemPage({poem,index,active,onCurrent,previous,next,onSelect}:{poem:PoemRecord|null;index:number;active:boolean;onCurrent?:()=>void;previous?:{poem:PoemRecord;index:number};next?:{poem:PoemRecord;index:number};onSelect:(page:PoemPage)=>void}){
  const pages=useMemo(()=>poem?paginatePoem(poem,index):[],[poem?.slug,poem?.body,index]);
  const previousPages=useMemo(()=>previous?paginatePoem(previous.poem,previous.index):[],[previous?.poem.slug,previous?.poem.body,previous?.index]);
  const nextPages=useMemo(()=>next?paginatePoem(next.poem,next.index):[],[next?.poem.slug,next?.poem.body,next?.index]);
  const [pageIndex,setPageIndex]=useState(0);
  const currentPage=pages[Math.min(pageIndex,Math.max(0,pages.length-1))]??null;
  const previousPage=currentPage?.pageIndex&&currentPage.pageIndex>0?pages[currentPage.pageIndex-1]:previousPages.at(-1);
  const nextPage=currentPage&&currentPage.pageIndex+1<pages.length?pages[currentPage.pageIndex+1]:nextPages[0];
  const texture=usePoemPageTexture(currentPage);
  const [turn,setTurn]=useState<PortfolioPageTurnState|null>(null);
  const targetTexture=usePoemPageTexture(turn?.page??null);
  const materialRef=useRef<THREE.MeshBasicMaterial>(null),turningMaterialRef=useRef<THREE.MeshBasicMaterial>(null),turningBackMaterialRef=useRef<THREE.MeshBasicMaterial>(null),turningPageRef=useRef<THREE.Group>(null);
  const turnProgressRef=useRef(0),turnFinishedRef=useRef(false);
  useEffect(()=>{setPageIndex(0);},[poem?.slug]);
  // A small grid gives the active sheet enough vertices to flex without cloth
  // simulation. The inactive page stack remains instanced and untouched.
  const turningGeometry=useMemo(()=>new THREE.PlaneGeometry(.704,.682,12,6),[]);
  const originalTurningPositions=useMemo(()=>Float32Array.from(turningGeometry.getAttribute("position").array as ArrayLike<number>),[turningGeometry]);
  useEffect(()=>()=>turningGeometry.dispose(),[turningGeometry]);
  useEffect(()=>{
    if(turn?.complete&&poem?.slug===turn.page.poem.slug){setTurn(null);turnProgressRef.current=0;turnFinishedRef.current=false;}
  },[poem?.slug,turn]);
  useFrame((_,delta)=>{
    if(materialRef.current){
      const channel=THREE.MathUtils.damp(materialRef.current.color.r,active?1:.018,3.2,delta);
      materialRef.current.color.setRGB(channel,channel,channel);
    }
    // The moving sheet uses MeshBasicMaterial so its texture remains legible
    // while turning. It therefore needs the same scene-activity dimming as
    // the resting page; otherwise a turned page stays bright after leaving
    // the Poems scene.
    if(turningMaterialRef.current){
      const channel=THREE.MathUtils.damp(turningMaterialRef.current.color.r,active?1:.018,3.2,delta);
      turningMaterialRef.current.color.setRGB(channel,channel,channel);
    }
    if(turningBackMaterialRef.current){
      const target=active?PORTFOLIO_TURNED_PAGE_ACTIVE_COLOR:PORTFOLIO_TURNED_PAGE_DIM_COLOR;
      turningBackMaterialRef.current.color.lerp(target,1-Math.exp(-3.2*delta));
    }
    if(!turn||turn.complete||!turningPageRef.current)return;
    turnProgressRef.current=Math.min(1,turnProgressRef.current+delta/1.28);
    const progress=turnProgressRef.current;
    // The page does not rotate as one rigid card. Instead, a soft crease
    // travels from the free edge to the rings, like the fold used by a
    // physical page-turn: the already-folded part follows the turn while the
    // remaining part stays on the desk until the crease reaches it.
    const travelProgress=THREE.MathUtils.clamp((progress-.07)/.93,0,1);
    const sweepEased=travelProgress<.5
      ?4*travelProgress*travelProgress*travelProgress
      :1-Math.pow(-2*travelProgress+2,3)/2;
    const turnAngle=(turn.direction===1?-1:1)*Math.PI*sweepEased;
    turningPageRef.current.rotation.y=0;
    const positions=turningGeometry.getAttribute("position") as THREE.BufferAttribute;
    const liftPhase=THREE.MathUtils.clamp(progress/.22,0,1);
    const liftEnvelope=liftPhase*liftPhase*(3-2*liftPhase);
    const creaseWidth=.17;
    // Keep the crease just ahead of the visible fold. This makes the outer
    // corner peel first, then lets the fold line sweep across the sheet.
    const creasePosition=1.12-travelProgress*1.3;
    for(let vertex=0;vertex<positions.count;vertex++){
      const offset=vertex*3;
      const u=originalTurningPositions[offset]/.704+.5;
      const v=originalTurningPositions[offset+1]/.682+.5;
      const fromLeft=turn.direction===-1;
      const travel=fromLeft?1-u:u;
      // A small diagonal bias prevents a perfectly straight, mechanical fold.
      // The two outside corners lead by a few millimetres, while the rings
      // remain the fixed hinge throughout.
      const diagonalLead=(v-.5)*.085*(.35+.65*travelProgress);
      const foldTravel=THREE.MathUtils.clamp(travel+diagonalLead,0,1);
      const foldMask=THREE.MathUtils.smoothstep(
        foldTravel,
        creasePosition-creaseWidth,
        creasePosition+creaseWidth,
      );
      const creaseDistance=Math.abs(foldTravel-creasePosition)/creaseWidth;
      const creaseCurl=Math.max(0,1-creaseDistance);
      const foldLift=.034*Math.sin(Math.PI*travelProgress)*Math.pow(travel,.82)*foldMask;
      const creaseLift=.065*Math.sin((Math.PI*.5)*creaseCurl)*Math.sin(Math.PI*travelProgress);
      const crossBend=.018*creaseCurl*(v-.5)*Math.sin(Math.PI*travelProgress);
      const localAngle=turnAngle*foldMask;
      const relativeX=originalTurningPositions[offset]+(fromLeft?-.352:.352);
      const normalOffset=foldLift+creaseLift;
      const rotatedX=relativeX*Math.cos(localAngle)+normalOffset*Math.sin(localAngle);
      const rotatedZ=-relativeX*Math.sin(localAngle)+normalOffset*Math.cos(localAngle);
      positions.setX(vertex,(fromLeft?.352:-.352)+rotatedX);
      positions.setY(vertex,originalTurningPositions[offset+1]+crossBend);
      positions.setZ(vertex,rotatedZ);
    }
    positions.needsUpdate=true;
    // Do not hand control back to the static page until its canvas texture is
    // ready. This removes the one-frame white/black flash that otherwise
    // reads as a bounce at the end of the turn.
    if(progress>=1&&targetTexture&&!turnFinishedRef.current){
      turnFinishedRef.current=true;
      if(turn.page.poem.slug===poem?.slug){
        setPageIndex(turn.page.pageIndex);
        setTurn(null);
        turnProgressRef.current=0;
        turnFinishedRef.current=false;
      }else{
        setTurn((current)=>current?{...current,complete:true}:current);
        onSelect(turn.page);
      }
    }
  });
  const beginTurn=(target:PoemPage|undefined,direction:-1|1)=>{
    if(!target)return;
    if(turn)return;
    turnProgressRef.current=0;turnFinishedRef.current=false;
    setTurn({page:target,direction,complete:false});
  };
  // The right-hand page is always the reading surface. Moving forward flips
  // the current poem away from it and reveals the next poem underneath. When
  // moving backward, the sheet coming from the left is the blank reverse of
  // the stack; the previous poem is already underneath on the right. Keeping
  // that distinction prevents a poem from appearing on the wrong face before
  // it lands.
  // Keep the currently visible poem on its original side for the whole
  // physical turn. The parent route/poem update swaps in the destination
  // texture only after `onSelect` fires at the end of the animation.
  const baseTexture=texture;
  const movingTexture=turn?.direction===1?texture:null;
  return <>
    {(index>0||(currentPage?.pageIndex??0)>0)&&<mesh geometry={PORTFOLIO_PAGE_SURFACE_GEOMETRY} position={[-.309,.071,0]} rotation-x={-Math.PI/2} castShadow receiveShadow>
      <meshBasicMaterial color="#e6dcc7" side={THREE.DoubleSide} toneMapped={false}/>
    </mesh>}
    <mesh geometry={PORTFOLIO_PAGE_SURFACE_GEOMETRY} position={[.395,.071,0]} rotation-x={-Math.PI/2} onClick={(event)=>{event.stopPropagation();onCurrent?.();}}>
      <meshBasicMaterial ref={materialRef} map={baseTexture} color={active?"#ffffff":"#242424"} toneMapped={false}/>
    </mesh>
    {turn&&<group ref={turningPageRef} position={[.043,.074,0]} rotation-y={0}>
      <mesh geometry={turningGeometry} position={[turn.direction===-1?-.352:.352,0,0]} rotation-x={-Math.PI/2} castShadow receiveShadow>
        {/* White keeps the texture's own color intact while the sheet moves. */}
        <meshBasicMaterial ref={turningMaterialRef} map={movingTexture} color="#ffffff" side={THREE.FrontSide} toneMapped={false}/>
      </mesh>
      <mesh geometry={turningGeometry} position={[turn.direction===-1?-.352:.352,-.001,0]} rotation-x={-Math.PI/2} castShadow receiveShadow>
        <meshBasicMaterial ref={turningBackMaterialRef} color="#e6dcc7" side={THREE.BackSide} toneMapped={false}/>
      </mesh>
    </group>}
    {!turn&&previousPage&&<PoemPageTurn position={[-.7,.081,.05]} label="‹" onSelect={()=>beginTurn(previousPage,-1)}/>}
    {!turn&&nextPage&&<PoemPageTurn position={[.7,.081,.05]} label="›" onSelect={()=>beginTurn(nextPage,1)}/>}
  </>;
}

function PoemsPortfolio({position,rotation,active,poemsContent,activePoemSlug,onPoemSelect}:{position:[number,number];rotation:number;active:boolean;poemsContent:PoemsContentState;activePoemSlug:string|null;onPoemSelect:(slug:string)=>unknown}){
  const coversRef=useRef<THREE.InstancedMesh>(null),liningsRef=useRef<THREE.InstancedMesh>(null),pagesRef=useRef<THREE.InstancedMesh>(null);
  const ringsRef=useRef<THREE.InstancedMesh>(null),eyeletsRef=useRef<THREE.InstancedMesh>(null),stitchesRef=useRef<THREE.InstancedMesh>(null);
  const readingLightRef=useRef<THREE.PointLight>(null);
  const requestedIndex=activePoemSlug?poemsContent.poems.findIndex(({slug})=>slug===activePoemSlug):-1;
  const activeIndex=requestedIndex>=0?requestedIndex:0;
  const activePoem=poemsContent.poems[activeIndex]??null;
  useFrame((_,delta)=>{if(readingLightRef.current)readingLightRef.current.intensity=THREE.MathUtils.damp(readingLightRef.current.intensity,active?4.5:0,3.2,delta);});
  useLayoutEffect(()=>{
    const covers=coversRef.current,linings=liningsRef.current,pages=pagesRef.current,rings=ringsRef.current,eyelets=eyeletsRef.current,stitches=stitchesRef.current;
    if(!covers||!linings||!pages||!rings||!eyelets||!stitches)return;
    const dummy=new THREE.Object3D();
    [-.43,.43].forEach((x,index)=>{
      dummy.position.set(x,-.015,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();covers.setMatrixAt(index,dummy.matrix);
      dummy.position.set(x,.013,0);dummy.updateMatrix();linings.setMatrixAt(index,dummy.matrix);
    });
    for(let index=0;index<6;index++){
      // Keep the reserve sheets as a tight physical stack instead of six
      // visibly separated cards; the active reading sheet still sits above it.
      dummy.position.set(.4,.024+index*.0072,(index-2.5)*.0012);dummy.rotation.set(0,(index-2.5)*.0012,0);dummy.scale.set(1-index*.004,1,1-index*.003);dummy.updateMatrix();pages.setMatrixAt(index,dummy.matrix);
      // The page's binding edge is x=.04. Center each ring on that edge so it
      // visibly passes through the paper instead of floating in the cover gap.
      const bindingZ=-.245+index*.098;
      dummy.position.set(.04,.057,bindingZ);dummy.rotation.set(0,0,index%2?.025:-.018);dummy.scale.set(1,1,1);dummy.updateMatrix();rings.setMatrixAt(index,dummy.matrix);
      dummy.position.set(.04,.071,bindingZ);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();eyelets.setMatrixAt(index,dummy.matrix);
    }
    let stitchIndex=0;
    [-.43,.43].forEach((center)=>{
      for(let index=0;index<10;index++)for(const z of [-.34,.34]){
        dummy.position.set(center-.315+index*.07,.015,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();stitches.setMatrixAt(stitchIndex++,dummy.matrix);
      }
      for(let index=0;index<6;index++){
        const outer=center<0?center-.36:center+.36;
        dummy.position.set(outer,.015,-.25+index*.1);dummy.rotation.set(0,Math.PI/2,0);dummy.scale.set(1,1,1);dummy.updateMatrix();stitches.setMatrixAt(stitchIndex++,dummy.matrix);
      }
    });
    [covers,linings,pages,rings,eyelets,stitches].forEach((mesh)=>{mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();});
  },[]);
  return <group position={[position[0],-.0325,position[1]]} rotation-y={THREE.MathUtils.degToRad(rotation)} dispose={null}>
    <instancedMesh ref={coversRef} args={[PORTFOLIO_COVER_GEOMETRY,PORTFOLIO_LEATHER_MATERIAL,2]} castShadow receiveShadow/>
    <instancedMesh ref={liningsRef} args={[PORTFOLIO_LINING_GEOMETRY,PORTFOLIO_LINING_MATERIAL,2]}/>
    <mesh geometry={PORTFOLIO_POCKET_GEOMETRY} position={[-.43,.027,.055]} castShadow><primitive object={PORTFOLIO_LEATHER_MATERIAL} attach="material"/></mesh>
    <PortfolioPolaroid/>
    <mesh geometry={PORTFOLIO_SLOT_GEOMETRY} position={[-.48,.043,.13]}><primitive object={PORTFOLIO_LEATHER_MATERIAL} attach="material"/></mesh>
    <mesh geometry={PORTFOLIO_PEN_LOOP_GEOMETRY} position={[-.075,.06,.12]} rotation-x={Math.PI/2}><primitive object={PORTFOLIO_LEATHER_MATERIAL} attach="material"/></mesh>
    <instancedMesh ref={pagesRef} args={[PORTFOLIO_PAGE_GEOMETRY,PORTFOLIO_PAPER_MATERIAL,6]} castShadow onClick={(event)=>{event.stopPropagation();if(activePoem)onPoemSelect(activePoem.slug);}}/>
    <PortfolioPoemPage poem={activePoem} index={activeIndex} active={active} onCurrent={activePoem?()=>onPoemSelect(activePoem.slug):undefined} previous={activeIndex>0?{poem:poemsContent.poems[activeIndex-1],index:activeIndex-1}:undefined} next={activeIndex<poemsContent.poems.length-1?{poem:poemsContent.poems[activeIndex+1],index:activeIndex+1}:undefined} onSelect={(selectedPage)=>onPoemSelect(selectedPage.poem.slug)}/>
    <pointLight ref={readingLightRef} position={[.43,.62,.02]} color="#ffd39a" intensity={0} distance={1.4} decay={2}/>
    <instancedMesh ref={ringsRef} args={[PORTFOLIO_RING_GEOMETRY,PORTFOLIO_METAL_MATERIAL,6]} castShadow/>
    <instancedMesh ref={eyeletsRef} args={[PORTFOLIO_EYELET_GEOMETRY,PORTFOLIO_METAL_MATERIAL,6]} castShadow/>
    <mesh geometry={PORTFOLIO_ZIPPER_GEOMETRY} castShadow><primitive object={PORTFOLIO_METAL_MATERIAL} attach="material"/></mesh>
    <instancedMesh ref={stitchesRef} args={[PORTFOLIO_STITCH_GEOMETRY,PORTFOLIO_PAPER_MATERIAL,52]}/>
    <mesh geometry={PORTFOLIO_PULL_GEOMETRY} position={[.81,.028,.36]} rotation-y={-.3} castShadow><primitive object={PORTFOLIO_METAL_MATERIAL} attach="material"/></mesh>
    <mesh geometry={PORTFOLIO_RING_GEOMETRY} position={[.85,.042,.35]} rotation={[Math.PI/2,0,-.3]} scale={.58}><primitive object={PORTFOLIO_METAL_MATERIAL} attach="material"/></mesh>
  </group>;
}

function PhoneScreen({active}:{active:boolean}){
  const texture=useTexture(withSceneBasePath("/phone.jpeg"));
  const materialRef=useRef<THREE.MeshBasicMaterial>(null);
  const lightRef=useRef<THREE.PointLight>(null);
  const [hovered,setHovered]=useState(false);
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;texture.repeat.set(IPHONE_SCREEN_TEXTURE_REPEAT_X,1);texture.offset.set((1-IPHONE_SCREEN_TEXTURE_REPEAT_X)/2,0);
  useCursor(active&&hovered);
  useEffect(()=>{if(!active)setHovered(false);},[active]);
  useFrame((_,delta)=>{
    const material=materialRef.current,light=lightRef.current;
    const easing=16;
    if(material){
      let channel=THREE.MathUtils.damp(material.color.r,active?1:0,easing,delta);
      if(!active&&channel<.001)channel=0;
      material.color.setRGB(channel,channel,channel);
    }
    if(light){
      light.intensity=THREE.MathUtils.damp(light.intensity,active?.26:0,12,delta);
      if(!active&&light.intensity<.001)light.intensity=0;
    }
  });
  return <>
    <mesh geometry={IPHONE_SCREEN_IMAGE_GEOMETRY} position={[0,.0182,0]}
      onPointerOver={(event)=>{if(!active)return;event.stopPropagation();setHovered(true);}}
      onPointerOut={()=>setHovered(false)}
      onClick={(event)=>{if(!active)return;event.stopPropagation();window.open(PHONE_CONTACT_URL,"_blank","noopener,noreferrer");}}>
      <meshBasicMaterial ref={materialRef} map={texture} color="#050505" toneMapped={false}/>
    </mesh>
    <pointLight ref={lightRef} position={[0,.11,0]} color="#dce7f2" intensity={0} distance={.9} decay={2}/>
  </>;
}

function Phone({active}:{active:boolean}) {
  const [screenLoaded,setScreenLoaded]=useState(active);
  useEffect(()=>{if(active)setScreenLoaded(true);},[active]);
  return <group position={PHONE_LAYOUT.localPosition} rotation-y={THREE.MathUtils.degToRad(PHONE_LAYOUT.rotationDegrees)} dispose={null}>
  <mesh geometry={IPHONE_BODY_GEOMETRY} castShadow receiveShadow>
    <primitive object={IPHONE_FRAME_MATERIAL} attach="material"/>
  </mesh>
  <mesh geometry={IPHONE_SCREEN_GEOMETRY} position={[0,.0175,0]}>
    <primitive object={IPHONE_BACK_MATERIAL} attach="material"/>
  </mesh>
  <mesh geometry={IPHONE_DYNAMIC_ISLAND_GEOMETRY} position={[0,.0185,-.255]}>
    <primitive object={IPHONE_GLASS_MATERIAL} attach="material"/>
  </mesh>
  {screenLoaded&&<Suspense fallback={null}><PhoneScreen active={active}/></Suspense>}
  <mesh geometry={IPHONE_BACK_GEOMETRY} position={[0,-.0172,0]}>
    <primitive object={IPHONE_BACK_MATERIAL} attach="material"/>
  </mesh>
  <mesh geometry={IPHONE_CAMERA_ISLAND_GEOMETRY} position={[-.085,-.0164,-.23]} castShadow>
    <primitive object={IPHONE_BACK_MATERIAL} attach="material"/>
  </mesh>
  {[[-.112,-.262],[-.058,-.262],[-.085,-.205]].map(([x,z])=><mesh key={`${x}:${z}`} geometry={IPHONE_LENS_GEOMETRY} position={[x,-.021,z]} castShadow>
    <primitive object={IPHONE_GLASS_MATERIAL} attach="material"/>
  </mesh>)}
  <mesh geometry={IPHONE_FLASH_GEOMETRY} position={[-.045,-.0231,-.205]} rotation-x={Math.PI/2}>
    <primitive object={IPHONE_FLASH_MATERIAL} attach="material"/>
  </mesh>
</group> }

function PaperAndPen({position,rotation,penPosition,penRotation}:{position:[number,number];rotation:number;penPosition:[number,number];penRotation:number}) { return <group position={[position[0],-.064,position[1]]} rotation-y={THREE.MathUtils.degToRad(rotation)}>
  <RoundedBox args={[.72,.006,1.02]} radius={.006} castShadow receiveShadow><meshStandardMaterial color="#d8d5ce" roughness={.96} emissive="#25221e" emissiveIntensity={.08}/></RoundedBox>
  <mesh position={[0,.004,0]} rotation-x={-Math.PI/2}>
    <planeGeometry args={[.708,1.008]}/>
    <meshBasicMaterial color="#d2cec5" toneMapped={false}/>
  </mesh>
  <Suspense fallback={null}><Text
    position={[-.32,.012,-.46]}
    rotation-x={-Math.PI/2}
    anchorX="left"
    anchorY="top"
    fontSize={.044}
    fontWeight={700}
    outlineWidth={.0012}
    outlineColor="#000000"
    font={withSceneBasePath("/fonts/PatrickHand-Regular.ttf")}
  >About me<meshBasicMaterial color="#000000" toneMapped={false}/></Text>
  <Text
    position={[-.32,.011,-.395]}
    rotation-x={-Math.PI/2}
    anchorX="left"
    anchorY="top"
    maxWidth={.64}
    fontSize={.027}
    fontWeight={400}
    lineHeight={1.18}
    font={withSceneBasePath("/fonts/PatrickHand-Regular.ttf")}
  >{`I build products that think clearly and experiences that move with purpose.

With over a decade of experience across software engineering, UX, and product strategy, I’ve worked between technology and human experience, translating complex flows into intuitive, scalable, and data-driven systems. My experience goes from hands-on development and real-time system design to redefining how a SaaS logistics platform connects technology, operations, and user experience, balancing structure with creativity and meaningful outcomes.

Beyond product development, I’ve had the honor of teaching UX/UI at ESPOL’s coding bootcamp, the top university in my country, guiding professionals and students through usability, analytics, and the creative use of generative AI to enhance design thinking.

Curiosity and precision guide everything I build, connecting logic and empathy to create technology that truly serves people.

Hablante nativo de Español, fluent in English, and conversational in Brazilian Portuguese. Você pode me encontrar online como @DenkSchuldt.`}<meshBasicMaterial color="#000000" toneMapped={false}/></Text></Suspense>
  <Pen position={penPosition} rotation={penRotation}/>
</group> }

function Pen({position,rotation}:{position:[number,number];rotation:number}) { return <group position={[position[0],.021,position[1]]} rotation-y={THREE.MathUtils.degToRad(rotation)}>
  <mesh position={[.065,0,0]} rotation-z={Math.PI/2} castShadow>
    <cylinderGeometry args={[.0165,.0185,.394,24]}/>
    <meshPhysicalMaterial color="#17191a" metalness={.46} roughness={.28} clearcoat={.5} clearcoatRoughness={.24}/>
  </mesh>
  <mesh position={[-.187,0,0]} rotation-z={Math.PI/2} castShadow>
    <cylinderGeometry args={[.0155,.0168,.11,22]}/>
    <meshStandardMaterial color="#0d0f10" metalness={.3} roughness={.42}/>
  </mesh>
  {[-.222,-.205,-.188,-.171,-.154].map((x)=><mesh key={x} position={[x,0,0]} rotation-y={Math.PI/2}>
    <torusGeometry args={[.0166,.00065,5,18]}/>
    <meshStandardMaterial color="#34383a" metalness={.66} roughness={.3}/>
  </mesh>)}
  <mesh position={[-.273,0,0]} rotation-z={Math.PI/2} castShadow>
    <cylinderGeometry args={[.0025,.0157,.062,24]}/>
    <meshStandardMaterial color="#8b8983" metalness={.88} roughness={.2}/>
  </mesh>
  <mesh position={[-.306,0,0]} castShadow>
    <sphereGeometry args={[.0032,12,8]}/>
    <meshStandardMaterial color="#171717" metalness={.82} roughness={.16}/>
  </mesh>
  <mesh position={[-.13,0,0]} rotation-y={Math.PI/2}>
    <torusGeometry args={[.0176,.0015,7,22]}/>
    <meshStandardMaterial color="#7d7b75" metalness={.82} roughness={.22}/>
  </mesh>
  <mesh position={[.282,0,0]} rotation-z={Math.PI/2} castShadow>
    <cylinderGeometry args={[.015,.0185,.04,22]}/>
    <meshStandardMaterial color="#25282a" metalness={.55} roughness={.28}/>
  </mesh>
  <mesh position={[.304,0,0]} rotation-z={Math.PI/2}>
    <cylinderGeometry args={[.012,.015,.012,18]}/>
    <meshStandardMaterial color="#77756f" metalness={.78} roughness={.23}/>
  </mesh>
  <RoundedBox args={[.17,.004,.008]} radius={.002} position={[.17,.0195,0]} rotation-z={-.025} castShadow>
    <meshStandardMaterial color="#77756f" metalness={.84} roughness={.2}/>
  </RoundedBox>
  <mesh position={[.082,.0175,0]} rotation-z={-.08}>
    <boxGeometry args={[.018,.004,.01]}/>
    <meshStandardMaterial color="#77756f" metalness={.84} roughness={.2}/>
  </mesh>
</group> }

function DeskLamp({position}:{position:[number,number,number]}) {
  const lightRef=useRef<THREE.SpotLight>(null);
  const targetRef=useRef<THREE.Object3D>(null);
  useEffect(()=>{
    if(lightRef.current&&targetRef.current)lightRef.current.target=targetRef.current;
  },[]);
  return <group position={position} rotation-y={THREE.MathUtils.degToRad(6)} dispose={null}>
    <mesh geometry={DESK_LAMP_BASE_GEOMETRY} position={[0,.0325,0]} castShadow receiveShadow>
      <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={DESK_LAMP_BASE_INSET_GEOMETRY} position={[0,.068,0]} castShadow>
      <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={DESK_LAMP_JOINT_GEOMETRY} position={[-.07,.12,0]} rotation-x={Math.PI/2} castShadow>
      <primitive object={DESK_LAMP_BRASS_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={DESK_LAMP_ARM_GEOMETRY} position={[-.025,.42,0]} rotation-z={-.14} scale={[1,.64,1]} castShadow>
      <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={DESK_LAMP_JOINT_GEOMETRY} position={[.02,.73,0]} rotation-x={Math.PI/2} castShadow>
      <primitive object={DESK_LAMP_BRASS_MATERIAL} attach="material"/>
    </mesh>
    <mesh geometry={DESK_LAMP_ARM_GEOMETRY} position={[.13,.96,0]} rotation-z={-.39} scale={[1,.5,1]} castShadow>
      <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material"/>
    </mesh>
    <group position={[.28,1.18,0]} rotation-z={.28}>
      <mesh geometry={DESK_LAMP_COLLAR_GEOMETRY} position={[0,.13,0]} castShadow>
        <primitive object={DESK_LAMP_BRASS_MATERIAL} attach="material"/>
      </mesh>
      <mesh geometry={DESK_LAMP_HEAD_GEOMETRY} castShadow>
        <primitive object={DESK_LAMP_METAL_MATERIAL} attach="material"/>
      </mesh>
      <mesh geometry={DESK_LAMP_DIFFUSER_GEOMETRY} position={[0,-.104,0]} rotation-x={Math.PI/2}>
        <primitive object={DESK_LAMP_DIFFUSER_MATERIAL} attach="material"/>
      </mesh>
    </group>
    <spotLight ref={lightRef} position={[.31,1.07,0]} color="#ffad68" intensity={7.2} distance={2.15} angle={.55} penumbra={.86} decay={2}/>
    <object3D ref={targetRef} position={[.82,0,.28]}/>
  </group>;
}

function CoffeeSteam(){
  const refs=useRef<THREE.Sprite[]>([]);
  const materials=useMemo(()=>Array.from({length:3},()=>new THREE.SpriteMaterial({map:STEAM_TEXTURE,color:"#d7d0c7",transparent:true,opacity:0,depthWrite:false,toneMapped:false})),[]);
  useEffect(()=>()=>materials.forEach((material)=>material.dispose()),[materials]);
  useFrame(({clock})=>{
    const elapsed=clock.elapsedTime;
    refs.current.forEach((sprite,index)=>{
      const speed=[.135,.112,.096][index],phase=[.08,.43,.71][index];
      const cycle=(elapsed*speed+phase)%1,drift=Math.sin(elapsed*(.43+index*.07)+index*1.9+Math.sin(elapsed*.17+index))*.027;
      sprite.position.set((index-1)*.025+drift,.105+cycle*.34,Math.cos(elapsed*(.31+index*.05)+index)*.018);
      sprite.scale.set(.045+cycle*.035,.14+cycle*.1,1);
      sprite.material.opacity=Math.pow(Math.sin(Math.PI*cycle),1.4)*(.045+index*.006);
      sprite.material.rotation=Math.sin(elapsed*.29+index*2.1)*.16;
    });
  });
  return <>{materials.map((material,index)=><sprite key={index} ref={(sprite)=>{if(sprite)refs.current[index]=sprite;}}><primitive object={material} attach="material"/></sprite>)}</>;
}

function Coffee({position}:{position:[number,number,number]}) { return <group position={position} rotation-y={Math.PI+THREE.MathUtils.degToRad(5)} dispose={null}>
  <mesh geometry={MUG_BODY_GEOMETRY} position={[0,-.075,0]} castShadow receiveShadow><primitive object={MUG_CERAMIC_MATERIAL} attach="material"/></mesh>
  <mesh geometry={MUG_HANDLE_GEOMETRY} position={[.135,-.075,0]} castShadow><primitive object={MUG_CERAMIC_MATERIAL} attach="material"/></mesh>
  <mesh geometry={MUG_COFFEE_GEOMETRY} position={[0,.083,0]} rotation-x={-Math.PI/2}><primitive object={MUG_COFFEE_MATERIAL} attach="material"/></mesh>
  <CoffeeSteam/>
</group> }

export function Chair() {
  const armSupportsRef=useRef<THREE.InstancedMesh>(null),armPadsRef=useRef<THREE.InstancedMesh>(null);
  const baseArmsRef=useRef<THREE.InstancedMesh>(null),casterForksRef=useRef<THREE.InstancedMesh>(null),castersRef=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const supports=armSupportsRef.current,pads=armPadsRef.current,baseArms=baseArmsRef.current,forks=casterForksRef.current,casters=castersRef.current;
    if(!supports||!pads||!baseArms||!forks||!casters)return;
    const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),tangent=new THREE.Vector3();
    [-1,1].forEach((side,index)=>{
      dummy.position.set(side*.55,.43,.08);dummy.rotation.set(0,0,side*-.08);dummy.scale.set(1,1,1);dummy.updateMatrix();supports.setMatrixAt(index,dummy.matrix);
      dummy.position.set(side*.57,.7,-.035);dummy.rotation.set(0,side*.035,0);dummy.scale.set(1,1,1);dummy.updateMatrix();pads.setMatrixAt(index,dummy.matrix);
    });
    Array.from({length:5},(_,index)=>index*Math.PI*2/5+.18).forEach((angle,index)=>{
      dummy.position.set(Math.cos(angle)*.32,-.405,Math.sin(angle)*.32);dummy.rotation.set(0,-angle,0);dummy.scale.set(.64,1,1);dummy.updateMatrix();baseArms.setMatrixAt(index,dummy.matrix);
      dummy.position.set(Math.cos(angle)*.65,-.455,Math.sin(angle)*.65);dummy.rotation.set(0,-angle,0);dummy.scale.set(1,1,1);dummy.updateMatrix();forks.setMatrixAt(index,dummy.matrix);
      tangent.set(-Math.sin(angle),0,Math.cos(angle));dummy.position.set(Math.cos(angle)*.68,-.49,Math.sin(angle)*.68);dummy.quaternion.setFromUnitVectors(up,tangent);dummy.scale.set(1,1,1);dummy.updateMatrix();casters.setMatrixAt(index,dummy.matrix);
    });
    [supports,pads,baseArms,forks,casters].forEach((mesh)=>{mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();});
  },[]);
  return <group position={[1.45,.55,1.08]} rotation-y={Math.PI+THREE.MathUtils.degToRad(-135)} rotation-z={-.018} dispose={null}>
    <mesh geometry={CHAIR_SEAT_GEOMETRY} position={[0,.12,0]} castShadow receiveShadow><primitive object={CHAIR_FABRIC_MATERIAL} attach="material"/></mesh>
    <mesh position={[0,.045,.03]} castShadow><boxGeometry args={[1,.055,.78]}/><primitive object={CHAIR_FRAME_MATERIAL} attach="material"/></mesh>
    <group position={[0,1.02,.4]} rotation-x={-.1}>
      <mesh geometry={CHAIR_BACK_FRAME_GEOMETRY} castShadow><primitive object={CHAIR_FRAME_MATERIAL} attach="material"/></mesh>
      <mesh geometry={CHAIR_BACK_MESH_GEOMETRY} position={[0,0,.03]} castShadow><primitive object={CHAIR_FABRIC_MATERIAL} attach="material"/></mesh>
      <mesh geometry={CHAIR_BACK_PANEL_GEOMETRY} position={[0,0,-.045]} castShadow><primitive object={CHAIR_BACKING_MATERIAL} attach="material"/></mesh>
    </group>
    <mesh geometry={CHAIR_SPINE_GEOMETRY} position={[0,.5,.37]} rotation-x={-.12} castShadow><primitive object={CHAIR_FRAME_MATERIAL} attach="material"/></mesh>
    <mesh geometry={CHAIR_LUMBAR_GEOMETRY} position={[0,.76,.385]} rotation-z={Math.PI/2} castShadow><primitive object={CHAIR_FRAME_MATERIAL} attach="material"/></mesh>
    <instancedMesh ref={armSupportsRef} args={[CHAIR_ARM_SUPPORT_GEOMETRY,CHAIR_FRAME_MATERIAL,2]} castShadow/>
    <instancedMesh ref={armPadsRef} args={[CHAIR_ARM_PAD_GEOMETRY,CHAIR_FABRIC_MATERIAL,2]} castShadow/>
    <mesh geometry={CHAIR_GAS_LIFT_GEOMETRY} position={[0,-.145,0]} castShadow><primitive object={CHAIR_METAL_MATERIAL} attach="material"/></mesh>
    <mesh geometry={CHAIR_GAS_COLLAR_GEOMETRY} position={[0,-.235,0]} castShadow><primitive object={CHAIR_FRAME_MATERIAL} attach="material"/></mesh>
    <mesh geometry={CHAIR_HUB_GEOMETRY} position={[0,-.405,0]} castShadow><primitive object={CHAIR_METAL_MATERIAL} attach="material"/></mesh>
    <instancedMesh ref={baseArmsRef} args={[CHAIR_BASE_ARM_GEOMETRY,CHAIR_METAL_MATERIAL,5]} castShadow/>
    <instancedMesh ref={casterForksRef} args={[CHAIR_CASTER_FORK_GEOMETRY,CHAIR_FRAME_MATERIAL,5]} castShadow/>
    <instancedMesh ref={castersRef} args={[CHAIR_CASTER_GEOMETRY,CHAIR_FRAME_MATERIAL,5]} castShadow/>
  </group>;
}

const CERTIFICATE_THUMBNAILS=CERTIFICATES.map(({image})=>withSceneBasePath(`/certificates/thumbs/${image.replace(/\.[^.]+$/,".jpg")}`));
const ACTIVE_CERTIFICATE_COLOR=new THREE.Color().setRGB(1.46,1.43,1.38);
const AMBIENT_CERTIFICATE_COLOR=new THREE.Color("#756b5e");
const ACTIVE_CERTIFICATE_LABEL_COLOR=new THREE.Color("#9a7b4e");
const AMBIENT_CERTIFICATE_LABEL_COLOR=new THREE.Color("#0c0a08");
const CERTIFICATE_LIGHT_RISE=.44;
const CERTIFICATE_LIGHT_FALL=1.1;
const FRAME_WOOD=["#36241a","#251c18","#463022"] as const;

function CertificateCard({record,texture,index,position,rotation,tiltY,baseScale,illuminated,focused,onSelect}:{record:CertificateRecord;texture:THREE.Texture;index:number;position:[number,number,number];rotation:number;tiltY:number;baseScale:number;illuminated:boolean;focused:boolean;onSelect?:(slug:string)=>void}) {
  const ref=useRef<THREE.Group>(null);
  const imageMaterialRef=useRef<THREE.MeshStandardMaterial>(null);
  const labelMaterialRef=useRef<THREE.MeshStandardMaterial>(null);
  const frameColor=FRAME_WOOD[index%FRAME_WOOD.length];
  const activeLabelColor=useMemo(()=>ACTIVE_CERTIFICATE_LABEL_COLOR.clone().lerp(new THREE.Color(index<9?"#b99a67":"#7f6a4b"),.45),[index]);
  const [initialImageColor]=useState(()=>(illuminated?ACTIVE_CERTIFICATE_COLOR:AMBIENT_CERTIFICATE_COLOR).clone());
  const [initialImageEmission]=useState(()=>illuminated?.32:0);
  const [initialLabelColor]=useState(()=>(illuminated?activeLabelColor:AMBIENT_CERTIFICATE_LABEL_COLOR).clone());
  const [hovered,setHovered]=useState(false);
  const interactive=illuminated;
  useCursor(hovered&&interactive);
  useFrame((_,delta)=>{
    if(!ref.current)return;
    const activeHover=hovered&&interactive;
    const scale=THREE.MathUtils.damp(ref.current.scale.x,baseScale*(activeHover?1.065:1),6.5,delta);
    ref.current.scale.setScalar(scale);
    ref.current.position.z=THREE.MathUtils.damp(ref.current.position.z,activeHover?position[2]+.06:position[2],6,delta);
    if(imageMaterialRef.current){
      const target=illuminated?ACTIVE_CERTIFICATE_COLOR:AMBIENT_CERTIFICATE_COLOR;
      const easing=illuminated?CERTIFICATE_LIGHT_RISE:CERTIFICATE_LIGHT_FALL;
      imageMaterialRef.current.color.r=THREE.MathUtils.damp(imageMaterialRef.current.color.r,target.r,easing,delta);
      imageMaterialRef.current.color.g=THREE.MathUtils.damp(imageMaterialRef.current.color.g,target.g,easing,delta);
      imageMaterialRef.current.color.b=THREE.MathUtils.damp(imageMaterialRef.current.color.b,target.b,easing,delta);
      imageMaterialRef.current.emissiveIntensity=THREE.MathUtils.damp(imageMaterialRef.current.emissiveIntensity,illuminated?.32:0,easing,delta);
      if(labelMaterialRef.current){
        const labelTarget=illuminated?activeLabelColor:AMBIENT_CERTIFICATE_LABEL_COLOR;
        labelMaterialRef.current.color.r=THREE.MathUtils.damp(labelMaterialRef.current.color.r,labelTarget.r,easing,delta);
        labelMaterialRef.current.color.g=THREE.MathUtils.damp(labelMaterialRef.current.color.g,labelTarget.g,easing,delta);
        labelMaterialRef.current.color.b=THREE.MathUtils.damp(labelMaterialRef.current.color.b,labelTarget.b,easing,delta);
      }
    }
  });
  return <group ref={ref} position={position} rotation={[0,tiltY,rotation]} scale={baseScale} onPointerOver={()=>{if(interactive)setHovered(true);}} onPointerOut={()=>setHovered(false)} onClick={(event)=>{if(!interactive)return;event.stopPropagation();if(focused)window.open(record.url,"_blank","noopener,noreferrer");else onSelect?.(record.slug);}}>
    <RoundedBox args={[.482,.354,.035]} radius={.012} castShadow>
      <meshStandardMaterial color={frameColor} metalness={index%3===1?.22:.06} roughness={index%3===1?.46:.64}/>
    </RoundedBox>
    <RoundedBox args={[.456,.332,.014]} radius={.005} position={[0,0,.022]}>
      <meshStandardMaterial color="#b7ab96" roughness={.91}/>
    </RoundedBox>
    <mesh position={[0,0,.031]}>
      <planeGeometry args={[.428,.308]}/>
      <meshStandardMaterial ref={imageMaterialRef} map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={initialImageEmission} color={initialImageColor} roughness={.92} metalness={0}/>
    </mesh>
    {focused&&<Suspense fallback={null}><FullCertificateImage image={record.image}/></Suspense>}
    <mesh position={[-.196,-.169,.026]}>
      <boxGeometry args={[.048,.009,.005]}/>
      <meshStandardMaterial ref={labelMaterialRef} color={initialLabelColor} metalness={.32} roughness={.52}/>
    </mesh>
  </group>;
}

function FullCertificateImage({image}:{image:string}){
  const source=useTexture(withSceneBasePath(`/certificates/${image}`));
  const texture=useMemo(()=>{const configured=source.clone();configured.colorSpace=THREE.SRGBColorSpace;configured.anisotropy=8;configured.needsUpdate=true;return configured;},[source]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={[0,0,.034]}><planeGeometry args={[.428,.308]}/><meshStandardMaterial map={texture} emissiveMap={texture} emissive="#ffffff" emissiveIntensity={.32} color={ACTIVE_CERTIFICATE_COLOR} roughness={.92} metalness={0}/></mesh>;
}

function CertificateGallery({illuminated,focusedSlug,onCertificateSelect}:{illuminated:boolean;focusedSlug:string|null;onCertificateSelect?:(slug:string)=>void}){
  const textures=useTexture(CERTIFICATE_THUMBNAILS);
  textures.forEach((texture)=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;});
  return <>{CERTIFICATE_LAYOUT.map(({index,x,y,rotation,tiltY,scale,depth})=><CertificateCard key={CERTIFICATES[index].image} record={CERTIFICATES[index]} texture={textures[index]} index={index} position={[x,y,depth]} rotation={rotation} tiltY={tiltY} baseScale={scale} illuminated={illuminated} focused={focusedSlug===CERTIFICATES[index].slug} onSelect={onCertificateSelect}/>)}</>;
}

function ShelfPracticalLighting({illuminated}:{illuminated:boolean}){
  const lightRefs=useRef<THREE.RectAreaLight[]>([]);
  const ledRefs=useRef<THREE.MeshStandardMaterial[]>([]);
  const [initialLightIntensity]=useState(()=>illuminated?2.35:.01);
  const [initialStripEmission]=useState(()=>illuminated?.018:0);
  useFrame((_,delta)=>{
    const easing=illuminated?.4:.72;
    lightRefs.current.forEach((light)=>{light.intensity=THREE.MathUtils.damp(light.intensity,illuminated?2.35:.01,easing,delta);});
    ledRefs.current.forEach((material)=>{material.emissiveIntensity=THREE.MathUtils.damp(material.emissiveIntensity,illuminated?.018:0,easing,delta);});
  });
  return <>
    {[1.717,.827,-.063,-.953].map((y,rowIndex)=><group key={y} position={[0,y,0]}>
      <mesh position={[0,0,.335]}>
        <boxGeometry args={[2.28,.004,.01]}/>
        <meshStandardMaterial ref={(material)=>{if(material)ledRefs.current[rowIndex]=material;}} color="#30221a" emissive="#d9874e" emissiveIntensity={initialStripEmission} roughness={.76}/>
      </mesh>
      <rectAreaLight ref={(light)=>{if(light)lightRefs.current[rowIndex]=light;}} name={`shelf-led-row-${rowIndex}`} width={2.22} height={.035} color="#e6a06d" intensity={initialLightIntensity} position={[0,-.018,.415]} rotation-x={-.99}/>
    </group>)}
  </>;
}

function ShelfDecor(){return <>
  <group position={[.955,-.546,.43]}>
    {[[0,.092,.54,-.025],[.105,.082,.47,.02],[.205,.095,.58,.075]].map(([x,width,height,tilt],index)=><RoundedBox key={x} args={[width,height,.205]} radius={.009} position={[x,(height-.58)/2,0]} rotation-z={tilt} castShadow><meshStandardMaterial color={["#513326","#293638","#6b4b2f"][index]} roughness={.82}/></RoundedBox>)}
  </group>
  <group position={[-1.04,-1.697,.44]} rotation-y={-.08}>
    {[0,.064,.128].map((y,index)=><RoundedBox key={y} args={[[.34,.058,.22],[.31,.054,.2],[.35,.058,.21]][index] as [number,number,number]} radius={.008} position={[0,y,0]} rotation-y={index===1?.08:-.035} castShadow><meshStandardMaterial color={["#3c2b22","#695039","#28302d"][index]} roughness={.84}/></RoundedBox>)}
  </group>
  <group position={[.98,-1.651,.43]} rotation-y={.055}>
    <RoundedBox args={[.46,.15,.28]} radius={.02} castShadow><meshStandardMaterial color="#4b3020" roughness={.74}/></RoundedBox>
    <mesh position={[0,.08,.02]}><boxGeometry args={[.36,.012,.2]}/><meshStandardMaterial color="#715036" roughness={.62}/></mesh>
    <mesh position={[0,.02,.15]}><boxGeometry args={[.12,.025,.012]}/><meshStandardMaterial color="#34261e" metalness={.18}/></mesh>
  </group>
  <group position={[1.04,1.034,.43]}>
    <mesh castShadow><cylinderGeometry args={[.12,.09,.18,16]}/><meshStandardMaterial color="#6a4b35" roughness={.86}/></mesh>
    {[0,.9,1.8,2.7].map((angle,index)=><Capsule key={angle} args={[.035,.25,5,8]} position={[Math.sin(angle)*.075,.18+index*.025,Math.cos(angle)*.035]} rotation={[Math.sin(angle)*.52,angle,Math.cos(angle)*.32]} castShadow><meshStandardMaterial color={index%2?"#344332":"#293a2d"} roughness={.9}/></Capsule>)}
  </group>
</>}

export function Shelf({illuminated=false,focusedSlug=null,onCertificateSelect}:{illuminated?:boolean;focusedSlug?:string|null;onCertificateSelect?:(slug:string)=>void}) {
  return <group position={[-3.8,2,-3.63]}>
    <group position={[.07,0,.08]} rotation-y={THREE.MathUtils.degToRad(6)}>
      {[1.29,.43,-.43,-1.29].map((y,index)=><RoundedBox key={y} args={[2.36,.69,.075]} radius={.018} position={[0,y,-.315]} receiveShadow><meshStandardMaterial color={["#30231d","#382820","#2b211c","#35261e"][index]} roughness={.78-index*.025}/></RoundedBox>)}
      {[-1.78,-.89,0,.89,1.78].map((y,index)=><RoundedBox key={y} args={[2.62,.12,.74]} radius={.025} position={[0,y,0]} castShadow receiveShadow><meshStandardMaterial color={index%2?"#3f291b":"#493020"} roughness={.66+(index%2)*.06}/></RoundedBox>)}
      {[-1.27,1.27].map((x,index)=><RoundedBox key={x} args={[.085,3.62,.72]} radius={.025} position={[x,0,0]} castShadow><meshStandardMaterial color={index?"#2d2019":"#3a281e"} roughness={.7}/></RoundedBox>)}
      {[-1.18,1.18].map((x)=><mesh key={x} position={[x,-1.91,.04]} castShadow><boxGeometry args={[.14,.28,.54]}/><meshStandardMaterial color="#271b15" roughness={.76}/></mesh>)}
      {[-1.78,-.89,0,.89,1.78].map((y)=><mesh key={y} position={[0,y,.382]}><boxGeometry args={[2.46,.016,.018]}/><meshStandardMaterial color="#493023" roughness={.72}/></mesh>)}
      <ShelfPracticalLighting illuminated={illuminated}/>
      <ShelfDecor/>
    </group>
    <Suspense fallback={null}><CertificateGallery illuminated={illuminated} focusedSlug={focusedSlug} onCertificateSelect={onCertificateSelect}/></Suspense>
  </group>;
}

const WALL_IMAGES = ["arrival.jpg", "her.jpg", "interstellar.jpg", "matrix.jpg"]
  .map((image) => withSceneBasePath(`/wall/${image}`));

function PosterImages(){
  const textures = useTexture(WALL_IMAGES);
  textures.forEach((texture, index) => {
    const sourceAspect = index === 0 ? 1920 / 1200 : index === 3 ? 598 / 362 : 728 / 410;
    const frameAspect = 1.18 / .67;
    texture.colorSpace = THREE.SRGBColorSpace;
    if (sourceAspect > frameAspect) {
      texture.repeat.set(frameAspect / sourceAspect, 1);
      texture.offset.set((1 - texture.repeat.x) / 2, 0);
    } else {
      texture.repeat.set(1, sourceAspect / frameAspect);
      texture.offset.set(0, (1 - texture.repeat.y) / 2);
    }
  });
  return <>{[-2.13,-.71,.71,2.13].map((x,i)=><mesh key={WALL_IMAGES[i]} position={[x,0,.035]}><planeGeometry args={[1.18,.67]}/><meshStandardMaterial map={textures[i]} roughness={.82} toneMapped/></mesh>)}</>;
}

export function Posters() {
  return <group position={[1.7,3,-3.84]}>
    <group position={[0,.67,.08]}>
      <RoundedBox args={[.92,.075,.12]} radius={.035} castShadow><meshStandardMaterial color="#343231" metalness={.28} roughness={.55}/></RoundedBox>
      <mesh position={[0,-.03,-.12]}><boxGeometry args={[.08,.08,.22]}/><meshStandardMaterial color="#292827" metalness={.2} roughness={.6}/></mesh>
    </group>
    {[-2.13,-.71,.71,2.13].map((x)=><group key={x} position={[x,0,0]}>
      <mesh castShadow><boxGeometry args={[1.3,.79,.06]}/><meshStandardMaterial color="#151413" roughness={.72}/></mesh>
    </group>)}
    <Suspense fallback={null}><PosterImages/></Suspense>
  </group>;
}

export function Plant({position,rotationY}:{position:[number,number,number];rotationY:number}) {
  const stemsRef=useRef<THREE.InstancedMesh>(null);
  const darkLeavesRef=useRef<THREE.InstancedMesh>(null);
  const lightLeavesRef=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const stemMesh=stemsRef.current,darkMesh=darkLeavesRef.current,lightMesh=lightLeavesRef.current;
    if(!stemMesh||!darkMesh||!lightMesh)return;
    const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),start=new THREE.Vector3(),bend=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),leafDirection=new THREE.Vector3();
    let stemIndex=0,darkIndex=0,lightIndex=0;
    ZZ_STEMS.forEach((stem,plantIndex)=>{
      start.set(stem.x,.325,stem.z);
      bend.set(stem.x+stem.leanX*.42,.325+stem.height*.5,stem.z+stem.leanZ*.42);
      end.set(stem.x+stem.leanX,.325+stem.height,stem.z+stem.leanZ);
      ([[start,bend],[bend,end]] as const).forEach(([from,to])=>{
        direction.subVectors(to,from);const length=direction.length();
        dummy.position.copy(from).addScaledVector(direction,.5);dummy.quaternion.setFromUnitVectors(up,direction.normalize());dummy.scale.set(1,length,1);dummy.updateMatrix();stemMesh.setMatrixAt(stemIndex++,dummy.matrix);
      });
      [.4,.57,.74,.91].forEach((t,level)=>{
        const leafPosition=new THREE.Vector3().lerpVectors(start,end,t);
        leafPosition.x+=Math.sin(Math.PI*t)*stem.leanX*.18;leafPosition.z+=Math.sin(Math.PI*t)*stem.leanZ*.18;
        [0,Math.PI].forEach((opposite,side)=>{
          const angle=stem.angle+opposite+(level%2?.14:-.1);
          leafDirection.set(Math.cos(angle),.27+level*.045,Math.sin(angle)).normalize();
          dummy.position.copy(leafPosition);dummy.quaternion.setFromUnitVectors(up,leafDirection);dummy.rotateY((plantIndex-level+side)*.055);
          const scale=.68-level*.035+((plantIndex+side)%3)*.018;
          dummy.scale.set(scale*(side?.96:1.03),scale,scale);dummy.updateMatrix();
          const target=(plantIndex+level+side)%2?lightMesh:darkMesh;
          if(target===lightMesh)target.setMatrixAt(lightIndex++,dummy.matrix);else target.setMatrixAt(darkIndex++,dummy.matrix);
        });
      });
    });
    [stemMesh,darkMesh,lightMesh].forEach((mesh)=>{mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();});
  },[]);
  return <group position={position} rotation-y={THREE.MathUtils.degToRad(rotationY)} dispose={null}>
    <mesh geometry={ZZ_POT_GEOMETRY} castShadow receiveShadow>
      <primitive object={ZZ_POT_MATERIAL} attach="material"/>
    </mesh>
    <mesh position={[0,.303,0]} rotation-x={-Math.PI/2}>
      <circleGeometry args={[.205,16]}/><primitive object={ZZ_SOIL_MATERIAL} attach="material"/>
    </mesh>
    <instancedMesh ref={stemsRef} args={[ZZ_STEM_GEOMETRY,ZZ_LEAF_DARK_MATERIAL,10]} castShadow/>
    <instancedMesh ref={darkLeavesRef} args={[ZZ_LEAF_GEOMETRY,ZZ_LEAF_DARK_MATERIAL,20]} castShadow/>
    <instancedMesh ref={lightLeavesRef} args={[ZZ_LEAF_GEOMETRY,ZZ_LEAF_LIGHT_MATERIAL,20]} castShadow/>
  </group>;
}
