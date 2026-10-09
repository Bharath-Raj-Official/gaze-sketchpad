// Iris-relative gaze estimation, with one shared calculation for calibration and tracking.
class GazeTracker {
  constructor() {
    this.sensitivity = {x:15,y:22}; this.smoothingFactor=.15; this.deadZone=.02;
    this.smoothedGaze={x:.5,y:.5}; this.isCalibrated=false;
  }
  offsets(points) {
    if (!points || points.length<478) return null;
    const ids=[468,473,133,33,362,263];
    if (ids.some(i=>!points[i] || !Number.isFinite(points[i].x) || !Number.isFinite(points[i].y))) return null;
    const eye=(iris,a,b)=>{
      const w=Math.hypot(a.x-b.x,a.y-b.y);
      return w>1e-6 ? {x:(iris.x-(a.x+b.x)/2)/w,y:(iris.y-(a.y+b.y)/2)/w}:null;
    };
    const l=eye(points[468],points[133],points[33]), r=eye(points[473],points[362],points[263]);
    return l&&r ? {x:(l.x+r.x)/2,y:(l.y+r.y)/2}:null;
  }
  update(points) {
    const raw=this.offsets(points); if(!raw) return false;
    const offset={x:raw.x-(this.calibrationData?.offsetX||0),y:raw.y-(this.calibrationData?.offsetY||0)};
    for(const axis of ['x','y']) {
      if(Math.abs(offset[axis])<this.deadZone) offset[axis]=0;
      const mapped=.5+offset[axis]*this.sensitivity[axis]*(axis==='x'?-1:1);
      this.smoothedGaze[axis]=Math.max(0,Math.min(1,this.smoothingFactor*mapped+(1-this.smoothingFactor)*this.smoothedGaze[axis]));
    }
    this.combinedGaze={...this.smoothedGaze}; return true;
  }
  calibrate() {
    const offset=this.offsets(this.gazeController?.liveDetections?.[0]?.keypoints);
    if(!offset) return false;
    this.calibrationData={offsetX:offset.x,offsetY:offset.y}; this.isCalibrated=true;
    this.smoothedGaze={x:.5,y:.5}; return true;
  }
  setGazeController(controller) {this.gazeController=controller;}
  getGazePosition() {return {...this.smoothedGaze};}
  setSensitivity(x,y) {this.sensitivity={x:Math.max(1,Math.min(30,x)),y:Math.max(1,Math.min(30,y))};}
  isReady() {return this.isCalibrated;}
}
if(typeof module!=='undefined') module.exports=GazeTracker;
