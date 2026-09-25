import * as THREE from './three.module.min.js';

// A woven strip built along a spatial curve; all assets stay local.
const opening = document.getElementById('invitation-opening');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0xffffff, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'ribbon-canvas';
  renderer.domElement.setAttribute('aria-hidden','true');
  opening.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.6,1.6,3,-3,.1,30);
  camera.position.set(0,0,10);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#555555');
  for (const [x,y,z,w,h,intensity] of [[-4,2,3,3,7,7],[4,0,2,2,8,5],[0,5,-1,6,2,4]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(intensity),side:THREE.DoubleSide}));
    panel.position.set(x,y,z); panel.lookAt(0,0,0); studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio,.02);
  scene.environment = environment.texture;
  pmrem.dispose();
  studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
  scene.add(new THREE.HemisphereLight(0xffffff,0x99938c,2));
  const key = new THREE.DirectionalLight(0xffffff,3.5);
  key.position.set(-2,3,10);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-5,right:5,top:7,bottom:-7});
  key.shadow.bias=-.002;key.shadow.radius=5;scene.add(key);
  const fill = new THREE.DirectionalLight(0xe0e5ff,1.6);fill.position.set(4,-2,3);scene.add(fill);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.055}));
  backdrop.position.z=-1.4;backdrop.receiveShadow=true;scene.add(backdrop);

  const label = document.createElement('canvas');
  const ctx=label.getContext('2d');
  const phrase='WITH LOVE  ·  YOUNGSUN & EUNJI  ·  27 FEBRUARY 2027  ·  ';
  ctx.font='36px Arial';
  // The tile ends exactly where the next phrase starts: no empty tail or clipped letters.
  label.width=Math.ceil(ctx.measureText(phrase).width);label.height=128;
  ctx.fillStyle='#292929';ctx.fillRect(0,0,label.width,128);
  ctx.fillStyle='#303030';for(let i=0;i<label.width;i+=3)ctx.fillRect(i,0,1,128);
  ctx.fillStyle='#555';ctx.fillRect(0,5,label.width,1);ctx.fillRect(0,122,label.width,1);
  ctx.fillStyle='#eeeae3';ctx.font='36px Arial';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillText(phrase,0,65);
  const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const material=new THREE.MeshPhysicalMaterial({map:texture,roughness:.34,metalness:.32,clearcoat:.38,clearcoatRoughness:.36,side:THREE.DoubleSide,envMapIntensity:.7});
  // Both bands share one scrolling coordinate: band two begins where band one ends.
  const textSpan=Math.round(2*.9*2048/label.width)/2;
  // Balanced, wide heart built from mirrored Bezier arcs.
  const heartLoop=new THREE.CurvePath();
  const hp=(x,y)=>new THREE.Vector3(x*.86,y,.2);
  heartLoop.add(new THREE.CubicBezierCurve3(hp(0,.38),hp(-.45,1.02),hp(-1.12,.83),hp(-1.08,.27)));
  heartLoop.add(new THREE.CubicBezierCurve3(hp(-1.08,.27),hp(-1.05,-.08),hp(-.35,-.58),hp(0,-.84)));
  heartLoop.add(new THREE.CubicBezierCurve3(hp(0,-.84),hp(.35,-.58),hp(1.05,-.08),hp(1.08,.27)));
  heartLoop.add(new THREE.CubicBezierCurve3(hp(1.08,.27),hp(1.12,.83),hp(.45,1.02),hp(0,.38)));
  const strips=[];const segments=180;const across=6;
  for(let n=0;n<2;n++){
    const positions=new Float32Array((segments+1)*(across+1)*3);
    const uv=new Float32Array((segments+1)*(across+1)*2);const indices=[];
    for(let i=0;i<=segments;i++)for(let j=0;j<=across;j++){
      const k=i*(across+1)+j;uv[k*2]=(n+i/segments)*textSpan;uv[k*2+1]=j/across;
      if(i<segments&&j<across){const b=k+across+1;indices.push(k,b,k+1,b,b+1,k+1);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);
    const mesh=new THREE.Mesh(geometry,material.clone());// Recolor only the ribbon as it forms the heart; lettering keeps its contrast.
    const pinkMix={value:0};mesh.userData.pinkMix=pinkMix;
    mesh.material.onBeforeCompile=shader=>{
      shader.uniforms.ribbonPink=pinkMix;
      shader.uniforms.babyPink={value:new THREE.Color('#f5b9cd')};
      shader.uniforms.roseInk={value:new THREE.Color('#925369')};
      shader.fragmentShader='uniform float ribbonPink;\nuniform vec3 babyPink;\nuniform vec3 roseInk;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float lettering = smoothstep(0.12, 0.55, dot(diffuseColor.rgb, vec3(0.333333)));
        vec3 pinkSurface = mix(babyPink, roseInk, lettering);
        diffuseColor.rgb = mix(diffuseColor.rgb, pinkSurface, ribbonPink);
      `);
    };
    mesh.material.customProgramCacheKey=()=> 'heart-pink-v1';
    mesh.material.map=texture.clone();mesh.material.map.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);strips.push(mesh);
  }
  let halfHeight=3,frame=0,last=0,elapsed=0,exitAt=null,pointerX=0,pointerY=0;
  const tangent=new THREE.Vector3(),side=new THREE.Vector3(),normal=new THREE.Vector3(),point=new THREE.Vector3();
  function resize(){const {width,height}=opening.getBoundingClientRect();if(!width||!height)return;halfHeight=1.6*height/width;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();renderer.setSize(width,height);}
  function draw(time){
    const dt=last?Math.min((time-last)/1000,.05):0;last=time;elapsed+=dt;
    const exiting=opening.classList.contains('is-opening');
    if(exiting&&exitAt===null)exitAt=elapsed;if(!exiting)exitAt=null;
    const mode=opening.dataset.motion||'cut';
    const shaped=mode!=='cut';
    const inspecting=opening.hasAttribute('data-inspect');
    const progress=inspecting?.5:exitAt===null?0:Math.min(1,(elapsed-exitAt)/(shaped?2.55:1.3));
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
    const gather=shaped?smooth(progress/(mode==='heart-out'?.48:.4)):0;
    const travel=shaped?(mode==='heart-out'?Math.max(0,Math.min(1,(progress-.43)/.55)):smooth((progress-.57)/.43)):0;
    const passageScale=1/(1-travel*.985);
    const aperture=mode==='heart-out'&&!inspecting?passageScale*.4*opening.clientWidth/3.2*smooth((progress-.48)/.15):0;
    opening.style.setProperty('--passage-radius',`${aperture}px`);
    // A brief pull-back, then a fast release instead of a uniform slide.
    const tension=exiting?Math.sin(Math.min(1,progress/.3)*Math.PI/2):0;
    const release=Math.max(0,Math.min(1,(progress-.24)/.62));
    const escape=release*release*release;
    const pull=exiting&&progress<.24?Math.sin(progress/.24*Math.PI)*.13:0;
    camera.zoom=1+(exiting?Math.sin(progress*Math.PI)*.055:0);
    camera.updateProjectionMatrix();
    const t=reduce.matches?0:elapsed*.33;
    strips.forEach((mesh,n)=>{
      const direction=n===0?1:-1;
      const phase=t*direction+n*1.5;
      const H=halfHeight;
      // The two visible bands are consecutive sections of the same lettering stream.
      const band=H*(n===0?.66:-.58);
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.6,band+.12,.1),
        new THREE.Vector3(-1.7,band-.08,.5),
        new THREE.Vector3(-.85,band+.17,.18),
        new THREE.Vector3(0,band+.03,.65),
        new THREE.Vector3(.85,band-.17,.3),
        new THREE.Vector3(1.7,band+.08,.1),
        new THREE.Vector3(2.6,band+.22,.5)
      ]);
      let target;
      if(mode==='orbit'){
        target=new THREE.Curve();
        target.getPoint=(u,out=new THREE.Vector3())=>out.set(direction*.94*Math.sin(u*Math.PI),-.94*Math.cos(u*Math.PI),.2);
      }else{
        target=new THREE.Curve();
        // Both bands meet on the same centerline with continuous lettering.
        target.getPoint=(u,out=new THREE.Vector3())=>heartLoop.getPoint((n+u)/2,out);
        target.getTangent=(u,out=new THREE.Vector3())=>{
          const t=(n+u)/2;
          const before=heartLoop.getPoint((t-.001+1)%1);
          const after=heartLoop.getPoint((t+.001)%1);
          out.copy(after).sub(before).normalize();
          const edge=Math.min(u,1-u);
          if(edge<.035){const x=(n===0)===(u<.5)?-1:1;out.lerp(new THREE.Vector3(x,0,0),1-edge/.035).normalize();}
          return out;
        };
      }
      const targetPoint=new THREE.Vector3(),targetTangent=new THREE.Vector3();
      const attr=mesh.geometry.attributes.position;
      for(let i=0;i<=segments;i++){
        const u=i/segments;curve.getPoint(u,point);curve.getTangent(u,tangent);
        point.y=band+(point.y-band)*(1-tension*.78);
        if(shaped){target.getPoint(u,targetPoint);target.getTangent(u,targetTangent);point.lerp(targetPoint,gather);tangent.lerp(targetTangent,gather).normalize();}
        side.set(-tangent.y,tangent.x,0).normalize();normal.crossVectors(tangent,side).normalize();
        const twist=(1-gather)*((Math.sin(u*9-phase)*.6+Math.sin(u*16-phase*.5)*.18)*(1-tension*.85)+(shaped?0:escape*.9));
        side.multiplyScalar(Math.cos(twist)).addScaledVector(normal,Math.sin(twist));
        const drift=Math.sin(u*8-phase)*.055*(1-gather);
        for(let j=0;j<=across;j++){
          const v=j/across-.5;const width=(.39+Math.sin(u*6+n)*.04)*(1-gather)+.22*gather;
          const k=i*(across+1)+j;
          attr.setXYZ(k,point.x+side.x*v*width,point.y+side.y*v*width+drift,point.z+side.z*v*width+.035*Math.cos(v*Math.PI*2));
        }
      }
      attr.needsUpdate=true;mesh.geometry.computeVertexNormals();
      mesh.scale.setScalar(1);
      mesh.material.opacity=1;mesh.material.transparent=true;
      const pink=(mode==='heart-in'||mode==='heart-out')?smooth((gather-.15)/.85):0;
      mesh.userData.pinkMix.value=pink;
      mesh.material.metalness=.32-pink*.22;
      mesh.material.roughness=.34+pink*.12;
      mesh.position.z=0;
      mesh.position.x=shaped?0:direction*(escape*7-pull)+pointerX*.035;mesh.position.y=shaped?0:-direction*escape*.9+pointerY*.025;
      if(shaped){
        const scale=mode==='heart-in'?1-travel*.96:mode==='heart-out'?passageScale:1+travel*6;
        mesh.scale.setScalar(scale);
        mesh.position.z=mode==='heart-in'?-travel*2:travel*1.2;
        mesh.material.opacity=mode==='heart-out'?1:1-smooth((travel-.7)/.3);
      }
      mesh.rotation.z=shaped?(mode==='orbit'?travel*Math.PI*.65:0):-escape*.16;
      mesh.material.map.offset.x=reduce.matches?0:-elapsed*.035;
      mesh.rotation.y=shaped? (mode==='heart-in'?travel*.35:0):Math.sin(phase)*.035;
    });
    renderer.render(scene,camera);
    if(!opening.hidden&&!document.hidden&&(!reduce.matches||exiting))frame=requestAnimationFrame(draw);else frame=0;
  }
  function wake(){if(!opening.hidden&&!document.hidden){resize();if(!frame){last=0;frame=requestAnimationFrame(draw);}}else{cancelAnimationFrame(frame);frame=0;}}
  new ResizeObserver(resize).observe(opening);
  new MutationObserver(wake).observe(opening,{attributes:true,attributeFilter:['hidden','class','data-motion','data-inspect']});
  document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',wake);
  opening.addEventListener('pointermove',e=>{const r=opening.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;},{passive:true});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;opening.classList.remove('has-ribbon-scene');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{opening.classList.add('has-ribbon-scene');wake();});
  resize();draw(0);opening.classList.add('has-ribbon-scene');
} catch(error) {
  renderer?.dispose();renderer?.domElement.remove();
  console.warn('3D opening unavailable; using the static invitation.',error);
}
