'use strict';
const $=id=>document.getElementById(id), paper=$('paper'), ctx=paper.getContext('2d');
const tracker=new GazeTracker(), mouth=new mouthOpenDetector(), controller={liveDetections:[]};
tracker.setGazeController(controller);mouth.setGazeController(controller);
let mode='pointer', stream=null, model=null, lastFace=0, previous=null, active=false, paused=false, generation=0, history=[], measurement=null;
function status(text){$('status').textContent=text;}
function snapshot(){if(history.length===20)history.shift();history.push(ctx.getImageData(0,0,paper.width,paper.height));}
function endStroke(){previous=null;active=false;}
function drawPoint(p,drawing){
  const point={x:p.x*paper.width,y:p.y*paper.height};
  if(drawing&&!active){snapshot();active=true;previous=point;}
  if(!drawing){endStroke();return;}
  ctx.strokeStyle=$('ink').value;ctx.lineWidth=Number($('brush').value);ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(previous.x,previous.y);ctx.lineTo(point.x,point.y);ctx.stroke();previous=point;
}
function clear(){ctx.fillStyle='#fff';ctx.fillRect(0,0,paper.width,paper.height);endStroke();}
clear();
function pointer(e){const r=paper.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
paper.addEventListener('pointerdown',e=>{if(mode!=='pointer')return;paper.setPointerCapture(e.pointerId);drawPoint(pointer(e),true);});
paper.addEventListener('pointermove',e=>{if(mode==='pointer'&&active)drawPoint(pointer(e),true);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])paper.addEventListener(event,endStroke);
function stopCamera(){generation++;model?.detectStop?.();stream?.getTracks().forEach(t=>t.stop());stream=null;measurement=null;$('preview').srcObject=null;controller.liveDetections=[];lastFace=0;tracker.isCalibrated=false;mouth.isCalibrated=false;endStroke();}
$('pointer').onclick=()=>{stopCamera();mode='pointer';paused=false;$('pointer').setAttribute('aria-pressed','true');$('camera').setAttribute('aria-pressed','false');$('camera').disabled=false;$('cursor').hidden=true;$('target').hidden=true;for(const id of ['calibrate','pause','measure'])$(id).disabled=true;status('Pointer demo · drag to draw');$('camera-note').textContent='The pointer demo needs no camera. Drag on the paper to explore.';};
function loadML(){return new Promise((resolve,reject)=>{if(window.ml5)return resolve();const script=document.createElement('script');script.src='https://unpkg.com/ml5@1.0.1/dist/ml5.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('Model library download failed. Check your connection and retry.'));document.head.appendChild(script);});}
async function withTimeout(promise,ms,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);})]);}finally{clearTimeout(timer);}}
$('camera').onclick=async()=>{
  stopCamera();mode='camera';const ticket=generation;$('camera').disabled=true;status('Connecting camera…');
  $('pointer').setAttribute('aria-pressed','false');$('camera').setAttribute('aria-pressed','true');
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera mode requires HTTPS or localhost. Use the pointer demo here.');
    const acquired=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
    if(ticket!==generation){acquired.getTracks().forEach(t=>t.stop());return;}
    stream=acquired;$('preview').srcObject=stream;await withTimeout($('preview').play(),10000,'Camera preview timed out. Retry or use the pointer demo.');await withTimeout(loadML(),20000,'Library loading timed out. Retry or use the pointer demo.');
    if(ticket!==generation)return;status('Loading face model…');
    const loadedModel=await withTimeout(new Promise(resolve=>{const instance=ml5.faceMesh({maxFaces:1,refineLandmarks:true,flipped:false},()=>resolve(instance));}),45000,'Face model loading timed out. Retry or use the pointer demo.');
    if(ticket!==generation)return;
    model=loadedModel;
    model.detectStart($('preview'),faces=>{if(ticket!==generation)return;controller.liveDetections=faces;if(faces.length)lastFace=performance.now();});
    $('calibrate').disabled=false;$('camera-note').textContent='Look at the centre of the paper, hold your head still and close your mouth. Then select Calibrate.';$('target').hidden=false;status('Camera ready · calibrate to begin');
  }catch(error){if(ticket!==generation)return;stopCamera();status(error.name==='NotAllowedError'?'Camera permission denied · allow it and retry, or use Pointer demo.':error.message);$('camera').disabled=false;}
};
$('calibrate').onclick=()=>{
  if(performance.now()-lastFace>500||!tracker.calibrate()||!mouth.calibrate()){status('No valid face landmarks · face the camera and retry');return;}
  paused=false;$('pause').textContent='Pause drawing';$('pause').disabled=false;$('measure').disabled=false;$('target').hidden=true;$('camera-note').textContent='Look to move. Open your mouth to draw; close it to lift the brush. Recalibrate if you move your head.';endStroke();status('Calibrated · ready to draw');
};
$('pause').onclick=()=>{paused=!paused;endStroke();$('pause').textContent=paused?'Resume drawing':'Pause drawing';};
$('undo').onclick=()=>{endStroke();if(history.length)ctx.putImageData(history.pop(),0,0);};
$('clear').onclick=()=>{snapshot();clear();};
$('export').onclick=()=>{endStroke();const link=document.createElement('a');link.download='gaze-sketch.png';link.href=paper.toDataURL('image/png');link.click();};
$('measure').onclick=()=>{measurement={start:performance.now(),samples:[]};$('target').hidden=false;endStroke();$('metrics').textContent='Measuring for three seconds…';};
function tick(){
  if(mode==='camera'&&tracker.isCalibrated){
    tracker.setSensitivity(Number($('sx').value),Number($('sy').value));tracker.smoothingFactor=Number($('smooth').value)/100;
    const points=controller.liveDetections[0]?.keypoints;
    if(performance.now()-lastFace>500||!tracker.update(points)){$('cursor').hidden=true;mouth.update(null);endStroke();if(measurement){measurement=null;$('target').hidden=true;$('metrics').textContent='Measurement cancelled: tracking was lost. Reacquire your face and retry.';}status('Tracking lost · drawing paused');}
    else{
      mouth.update(points);const p=tracker.getGazePosition();$('cursor').hidden=false;$('cursor').style.left=p.x*100+'%';$('cursor').style.top=p.y*100+'%';
      const drawing=!paused&&!measurement&&mouth.getIsMouthOpen();drawPoint(p,drawing);status(paused?'Paused':drawing?'Drawing · close your mouth to lift':'Tracking · open your mouth to draw');
      if(measurement){measurement.samples.push(p);if(performance.now()-measurement.start>=3000){const s=measurement.samples,n=s.length,m={x:s.reduce((a,p)=>a+p.x,0)/n,y:s.reduce((a,p)=>a+p.y,0)/n};const error=s.reduce((a,p)=>a+Math.hypot(p.x-.5,p.y-.5),0)/n;const jitter=Math.sqrt(s.reduce((a,p)=>a+(p.x-m.x)**2+(p.y-m.y)**2,0)/n);$('metrics').textContent=`Centre error ${(error*100).toFixed(1)}% of normalized canvas; jitter ${(jitter*100).toFixed(1)}%. ${n} rendered samples, one session.`;measurement=null;$('target').hidden=true;}}
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);window.addEventListener('pagehide',stopCamera);
