// Mouth opening relative to eye separation; calibration and updates share one calculation.
class mouthOpenDetector {
 constructor(){this.isMouthOpen=false;this.isCalibrated=false;this.aperture=0;this.smoothedAperture=0;this.smoothingFactor=.3;this.openThresholdMultiplier=1.6;this.recentStates=[];}
 measure(points){const ids=[13,14,12,15,267,271,37,84,33,263];
  if(!points||ids.some(i=>!points[i]||!Number.isFinite(points[i].x)||!Number.isFinite(points[i].y)))return null;
  const scale=Math.hypot(points[33].x-points[263].x,points[33].y-points[263].y);if(scale<1e-6)return null;
  return [[13,14],[12,15],[267,271],[37,84]].reduce((sum,[a,b])=>sum+Math.abs(points[b].y-points[a].y),0)/(4*scale);
 }
 update(points){const value=this.measure(points);if(value===null){this.isMouthOpen=false;this.recentStates=[];this.aperture=this.smoothedAperture=this.neutralAperture||0;return false;}
  this.smoothedAperture=this.smoothingFactor*value+(1-this.smoothingFactor)*this.smoothedAperture;this.aperture=this.smoothedAperture;
  if(!this.isCalibrated){this.isMouthOpen=false;return true;}
  this.recentStates.push(this.aperture>Math.max(.025,this.neutralAperture*this.openThresholdMultiplier));if(this.recentStates.length>5)this.recentStates.shift();
  if(this.recentStates.length>=3){const open=this.recentStates.filter(Boolean).length;if(open>=3)this.isMouthOpen=true;else if(this.recentStates.length-open>=3)this.isMouthOpen=false;}return true;
 }
 calibrate(){const value=this.measure(this.gazeController?.liveDetections?.[0]?.keypoints);if(value===null)return false;this.neutralAperture=value;this.aperture=this.smoothedAperture=value;this.isCalibrated=true;this.isMouthOpen=false;this.recentStates=[];return true;}
 setGazeController(controller){this.gazeController=controller;}
 getIsMouthOpen(){return this.isMouthOpen;}
 getIntensity(){return this.isCalibrated?Math.max(0,Math.min(1,this.aperture/Math.max(.025,this.neutralAperture*this.openThresholdMultiplier))):0;}
 isReady(){return this.isCalibrated;}
 setSensitivity(multiplier){if(Number.isFinite(multiplier))this.openThresholdMultiplier=Math.max(1.1,Math.min(4,multiplier));}
}
if(typeof module!=='undefined')module.exports=mouthOpenDetector;
