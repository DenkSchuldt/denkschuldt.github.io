"use client";
import { Capsule, RoundedBox, Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE as C } from "../constants";
import { withSceneBasePath } from "../camera/sceneRoutes";

const mat = { roughness: .82, metalness: 0 };

export function Room() { return <group>
  <mesh rotation-x={-Math.PI/2} receiveShadow><planeGeometry args={[18,15]}/><meshStandardMaterial color={C.floor} {...mat}/></mesh>
  <mesh position={[0,4,-4]} receiveShadow><planeGeometry args={[18,8]}/><meshStandardMaterial color={C.wall} {...mat}/></mesh>
  <mesh position={[-6,4,0]} rotation-y={Math.PI/2} receiveShadow><planeGeometry args={[8,8]}/><meshStandardMaterial color="#303239" {...mat}/></mesh>
  <mesh position={[0,8,0]} rotation-x={Math.PI/2}><planeGeometry args={[18,15]}/><meshStandardMaterial color="#24221f" {...mat}/></mesh>
  <mesh position={[-5.94,3.65,-.7]} rotation-y={Math.PI/2}><planeGeometry args={[3.3,3.8]}/><meshStandardMaterial color="#151a20" roughness={.5}/></mesh>
</group> }

export function Desk({onNavigate,onDrawer}:{onNavigate?:()=>void;onDrawer?:()=>void}) { return <group position={[0,0,-1.5]} onClick={(event)=>{event.stopPropagation();onNavigate?.();}}>
  <RoundedBox args={[5.5,.18,2.2]} radius={.08} position={[0,1.15,0]} castShadow receiveShadow><meshStandardMaterial color={C.wood} roughness={.66}/></RoundedBox>
  {[-2.35,2.35].flatMap(x=>[-.75,.75].map(z=><mesh key={`${x}${z}`} position={[x,.56,z]} castShadow><boxGeometry args={[.13,1.12,.13]}/><meshStandardMaterial color={C.metal} metalness={.65} roughness={.34}/></mesh>))}
  <Drawer onNavigate={onDrawer} />
</group> }

function Drawer({onNavigate}:{onNavigate?:()=>void}) { return <group position={[1.72,.68,0]} onClick={(event)=>{event.stopPropagation();onNavigate?.();}}>
  <RoundedBox args={[1.5,.72,1.72]} radius={.04} castShadow><meshStandardMaterial color={C.woodEdge} roughness={.72}/></RoundedBox>
  {[.86,.62].map((y,i)=><group key={y}><mesh position={[0,y-.68,.87]}><boxGeometry args={[1.37,.19,.04]}/><meshStandardMaterial color={C.wood}/></mesh><mesh position={[0,y-.68,.91]}><boxGeometry args={[.28,.035,.05]}/><meshStandardMaterial color={C.metal} metalness={.8}/></mesh></group>)}
</group> }

export function Laptop({position,rotation,onNavigate}:{position:[number,number,number];rotation:number;onNavigate?:()=>void}) { return <group position={[position[0],1.34+position[1],-1.5+position[2]]} rotation-y={THREE.MathUtils.degToRad(rotation)} onClick={(event)=>{event.stopPropagation();onNavigate?.();}}>
  <RoundedBox args={[1.72,.075,1.02]} radius={.055} position={[0,.02,0]} castShadow receiveShadow><meshStandardMaterial color="#4b4d4d" metalness={.18} roughness={.56}/></RoundedBox>
  <RoundedBox args={[1.55,.018,.68]} radius={.025} position={[0,.068,-.08]}><meshStandardMaterial color="#343637" metalness={.12} roughness={.5}/></RoundedBox>
  {[-.48,-.24,0,.24,.48].flatMap((x,row)=>[-.25,-.08,.09].map((z,col)=><mesh key={`${x}${z}`} position={[x+(col%2)*.025,.082,z-.09]}><boxGeometry args={[.16,.012,.105]}/><meshStandardMaterial color="#606263" roughness={.62}/></mesh>))}
  <RoundedBox args={[.56,.012,.3]} radius={.018} position={[0,.084,.31]}><meshStandardMaterial color="#57595a" roughness={.48}/></RoundedBox>
  <group position={[0,.075,-.49]} rotation-x={THREE.MathUtils.degToRad(-15)}>
    <RoundedBox args={[1.72,.98,.055]} radius={.055} position={[0,.49,0]} castShadow><meshStandardMaterial color="#464849" metalness={.15} roughness={.58}/></RoundedBox>
    <mesh position={[0,.49,.031]}><planeGeometry args={[1.56,.82]}/><meshStandardMaterial color="#060708" roughness={.82}/></mesh>
  </group>
</group> }

export function DeskObjects({coffeePosition,lampPosition,folderPosition,folderRotation,paperPosition,paperRotation,penPosition,penRotation,onPaper,onFolder,onPhone}:{coffeePosition:[number,number,number];lampPosition:[number,number,number];folderPosition:[number,number];folderRotation:number;paperPosition:[number,number];paperRotation:number;penPosition:[number,number];penRotation:number;onPaper?:()=>void;onFolder?:()=>void;onPhone?:()=>void}) { return <group position={[0,1.31,-1.5]}>
  <PaperAndPen position={paperPosition} rotation={paperRotation} penPosition={penPosition} penRotation={penRotation} onNavigate={onPaper} />
  <Phone onNavigate={onPhone} />
  <group position={[folderPosition[0],-.0325,folderPosition[1]]} rotation-y={THREE.MathUtils.degToRad(folderRotation)} onClick={(event)=>{event.stopPropagation();onFolder?.();}}>
    <RoundedBox args={[1.15,.075,.75]} radius={.035} castShadow><meshStandardMaterial color={C.leather} roughness={.78}/></RoundedBox>
    <RoundedBox args={[1.06,.04,.69]} radius={.025} position={[-.04,.08,.16]} rotation-x={.15} castShadow><meshStandardMaterial color="#5a3828" roughness={.8}/></RoundedBox>
    <RoundedBox args={[.72,.018,.48]} radius={.012} position={[-.1,.073,-.11]} rotation-y={-.025} castShadow><meshStandardMaterial color="#b8b2a7" roughness={.92}/></RoundedBox>
  </group>
  <Coffee position={coffeePosition}/>
  <DeskLamp position={lampPosition} />
</group> }

function Phone({onNavigate}:{onNavigate?:()=>void}) { return <group position={[-.25,-.057,.77]} rotation-y={THREE.MathUtils.degToRad(4)} onClick={(event)=>{event.stopPropagation();onNavigate?.();}}>
  <RoundedBox args={[.32,.026,.62]} radius={.052} castShadow receiveShadow><meshStandardMaterial color="#202223" metalness={.62} roughness={.3}/></RoundedBox>
  <RoundedBox args={[.292,.004,.584]} radius={.044} position={[0,.015,0]}><meshStandardMaterial color="#010202" metalness={.08} roughness={.2}/></RoundedBox>
  <RoundedBox args={[.105,.003,.025]} radius={.012} position={[0,.019,-.245]}><meshStandardMaterial color="#090a0b" roughness={.3}/></RoundedBox>
  <mesh position={[-.162,-.001,-.1]}><boxGeometry args={[.008,.017,.09]}/><meshStandardMaterial color="#303334" metalness={.7} roughness={.28}/></mesh>
  <mesh position={[-.162,-.001,.035]}><boxGeometry args={[.008,.017,.075]}/><meshStandardMaterial color="#303334" metalness={.7} roughness={.28}/></mesh>
  <mesh position={[.162,-.001,-.04]}><boxGeometry args={[.008,.017,.13]}/><meshStandardMaterial color="#303334" metalness={.7} roughness={.28}/></mesh>
</group> }

function PaperAndPen({position,rotation,penPosition,penRotation,onNavigate}:{position:[number,number];rotation:number;penPosition:[number,number];penRotation:number;onNavigate?:()=>void}) { return <group position={[position[0],-.064,position[1]]} rotation-y={THREE.MathUtils.degToRad(rotation)} onClick={(event)=>{event.stopPropagation();onNavigate?.();}}>
  <RoundedBox args={[.72,.006,1.02]} radius={.006} castShadow receiveShadow><meshStandardMaterial color="#d8d5ce" roughness={.96} emissive="#25221e" emissiveIntensity={.08}/></RoundedBox>
  <mesh position={[0,.004,0]} rotation-x={-Math.PI/2}>
    <planeGeometry args={[.708,1.008]}/>
    <meshBasicMaterial color="#d2cec5" toneMapped={false}/>
  </mesh>
  <Text
    position={[-.32,.012,-.46]}
    rotation-x={-Math.PI/2}
    anchorX="left"
    anchorY="top"
    fontSize={.044}
    fontWeight={700}
    outlineWidth={.0012}
    outlineColor="#000000"
    font="https://raw.githubusercontent.com/google/fonts/main/ofl/patrickhand/PatrickHand-Regular.ttf"
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
    font="https://raw.githubusercontent.com/google/fonts/main/ofl/patrickhand/PatrickHand-Regular.ttf"
  >{`I build products that think clearly and experiences that move with purpose.

With over a decade of experience across software engineering, UX, and product strategy, I’ve worked between technology and human experience, translating complex flows into intuitive, scalable, and data-driven systems. My experience goes from hands-on development and real-time system design to redefining how a SaaS logistics platform connects technology, operations, and user experience, balancing structure with creativity and meaningful outcomes.

Beyond product development, I’ve had the honor of teaching UX/UI at ESPOL’s coding bootcamp, the top university in my country, guiding professionals and students through usability, analytics, and the creative use of generative AI to enhance design thinking.

Curiosity and precision guide everything I build, connecting logic and empathy to create technology that truly serves people.

Hablante nativo de Español, fluent in English, and conversational in Brazilian Portuguese. Você pode me encontrar online como @DenkSchuldt.`}<meshBasicMaterial color="#000000" toneMapped={false}/></Text>
  <group position={[penPosition[0],.025,penPosition[1]]} rotation-y={THREE.MathUtils.degToRad(penRotation)}>
    <mesh rotation-z={Math.PI/2} castShadow>
      <cylinderGeometry args={[.018,.018,.52,12]}/><meshStandardMaterial color="#242526" metalness={.28} roughness={.48}/>
    </mesh>
    <mesh position={[-.285,0,0]} rotation-z={Math.PI/2}>
      <cylinderGeometry args={[.012,.018,.05,12]}/><meshStandardMaterial color="#171819" metalness={.3}/>
    </mesh>
  </group>
</group> }

function DeskLamp({position}:{position:[number,number,number]}) { return <group position={position} rotation-y={THREE.MathUtils.degToRad(6)}>
  <mesh castShadow><cylinderGeometry args={[.28,.32,.07,24]}/><meshStandardMaterial color="#303131" metalness={.2} roughness={.62}/></mesh>
  <mesh position={[0,.59,0]} rotation-z={-.16} castShadow><cylinderGeometry args={[.035,.045,1.14,14]}/><meshStandardMaterial color="#3b3c3c" metalness={.25} roughness={.5}/></mesh>
  <mesh position={[.15,1.14,.02]} rotation-z={-.32} castShadow><cylinderGeometry args={[.16,.31,.36,24,1,true]}/><meshStandardMaterial color="#454545" metalness={.12} roughness={.6} side={THREE.DoubleSide}/></mesh>
  <pointLight position={[.2,1.04,.04]} color="#ffad62" intensity={2.8} distance={1.5} decay={2}/>
</group> }

function Coffee({position}:{position:[number,number,number]}) { return <group position={position} rotation-y={Math.PI+THREE.MathUtils.degToRad(5)}>
  <mesh castShadow><cylinderGeometry args={[.18,.15,.34,24]}/><meshStandardMaterial color={C.ceramic} roughness={.48}/></mesh>
  <mesh position={[.21,.01,0]} rotation-x={Math.PI/2}><torusGeometry args={[.105,.035,10,18]}/><meshStandardMaterial color={C.ceramic}/></mesh>
  <mesh position={[0,.175,0]} rotation-x={-Math.PI/2}><circleGeometry args={[.145,24]}/><meshStandardMaterial color="#2a160d" roughness={.25}/></mesh>
</group> }

export function Chair() { return <group position={[-.92,.55,1.48]} rotation-y={Math.PI+.21} rotation-z={-.018}>
  <RoundedBox args={[1.2,.18,1.05]} radius={.16} castShadow><meshStandardMaterial color="#262321" roughness={.88}/></RoundedBox>
  <RoundedBox args={[1.22,1.55,.16]} radius={.16} position={[0,.9,.47]} rotation-x={-.12} castShadow><meshStandardMaterial color="#24211f" roughness={.88}/></RoundedBox>
  <mesh position={[0,-.43,0]}><cylinderGeometry args={[.08,.08,.75,14]}/><meshStandardMaterial color={C.metal} metalness={.6}/></mesh>
  <mesh position={[0,-.82,0]} rotation-z={Math.PI/2}><cylinderGeometry args={[.035,.035,1.15,10]}/><meshStandardMaterial color={C.metal}/></mesh>
</group> }

export function Shelf({onNavigate}:{onNavigate?:()=>void}) { return <group position={[-3.8,2,-3.63]} onClick={(event)=>{event.stopPropagation();onNavigate?.();}}>
  {[-1.7,-.85,0,.85,1.7].map(y=><mesh key={y} position={[0,y,0]} castShadow><boxGeometry args={[2.45,.1,.68]}/><meshStandardMaterial color={C.wood}/></mesh>)}
  {[-1.15,1.15].map(x=><mesh key={x} position={[x,0,0]} castShadow><boxGeometry args={[.1,3.5,.68]}/><meshStandardMaterial color={C.woodEdge}/></mesh>)}
  {[-.72,-.46,-.2,.22,.52].map((x,i)=><mesh key={x} position={[x,1.27,.04]}><boxGeometry args={[.18,.65-(i%2)*.12,.45]}/><meshStandardMaterial color={["#6c5843","#464641","#7a6b56"][i%3]}/></mesh>)}
</group> }

const WALL_IMAGES = ["arrival.jpg", "her.jpg", "interstellar.jpg", "matrix.jpg"]
  .map((image) => withSceneBasePath(`/wall/${image}`));

export function Posters({onNavigate}:{onNavigate?:()=>void}) {
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
  return <group position={[2.55,3,-3.84]} onClick={(event)=>{event.stopPropagation();onNavigate?.();}}>
    <group position={[0,.67,.08]}>
      <RoundedBox args={[.92,.075,.12]} radius={.035} castShadow><meshStandardMaterial color="#343231" metalness={.28} roughness={.55}/></RoundedBox>
      <mesh position={[0,-.03,-.12]}><boxGeometry args={[.08,.08,.22]}/><meshStandardMaterial color="#292827" metalness={.2} roughness={.6}/></mesh>
    </group>
    {[-2.13,-.71,.71,2.13].map((x,i)=><group key={WALL_IMAGES[i]} position={[x,0,0]}>
      <mesh castShadow><boxGeometry args={[1.3,.79,.06]}/><meshStandardMaterial color="#151413" roughness={.72}/></mesh>
      <mesh position={[0,0,.035]}><planeGeometry args={[1.18,.67]}/><meshStandardMaterial map={textures[i]} roughness={.82} toneMapped/></mesh>
    </group>)}
  </group>;
}

export function Plant({position,rotationY}:{position:[number,number,number];rotationY:number}) { return <group position={position} rotation-y={THREE.MathUtils.degToRad(rotationY)}>
  <mesh castShadow><cylinderGeometry args={[.25,.19,.48,18]}/><meshStandardMaterial color="#6b5543" roughness={.9}/></mesh>
  {[0,.8,1.6,2.4,3.2].map((a,i)=><Capsule key={a} args={[.08,.62,6,12]} position={[Math.sin(a)*.2,.62+i*.1,Math.cos(a)*.14]} rotation={[Math.sin(a)*.48,a,Math.cos(a)*.38]} castShadow><meshStandardMaterial color={C.green} roughness={.88}/></Capsule>)}
</group> }
