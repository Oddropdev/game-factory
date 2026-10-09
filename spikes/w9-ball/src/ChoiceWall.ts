// W10.6 real, central STOP obstacle with TWO physical side escape lanes.
// Unlike an invisible boundary it is a visible static Bullet blocker;
// the player must actively steer left or right to continue.
export type ChoiceWall={d:number;barrierWidth:number;barrierHeight:number;
 laneWidth:number;sectionStart:number;sectionEnd:number};
const smooth=(t:number)=>{const u=Math.max(0,Math.min(1,t));
 return u*u*(3-2*u)};
export function choiceWall(start:number,index:number,override=false):ChoiceWall|null{
 if(!override&&index%3!==1)return null;
 return {d:start+74,barrierWidth:9.4,barrierHeight:8.2,
  laneWidth:19,sectionStart:start+43,sectionEnd:start+122};
}
export function choiceLaneWidth(d:number,wall:ChoiceWall|null,original:number){
 if(!wall||d<=wall.sectionStart||d>=wall.sectionEnd)return original;
 const rise=smooth((d-wall.sectionStart)/24);
 const fall=smooth((wall.sectionEnd-d)/29);
 return original+(wall.laneWidth-original)*Math.min(rise,fall);
}
export function hasPhysicalEscape(wall:ChoiceWall,ballDiameter=1.24){
 return (wall.laneWidth-wall.barrierWidth)/2>ballDiameter+1.2;
}
export function sideDecision(lateral:number,wall:ChoiceWall):'left'|'right'|null{
 const clearance=wall.barrierWidth/2+.9;
 if(Math.abs(lateral)<=clearance)return null;
 return lateral<0?'left':'right';
}
