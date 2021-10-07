var canvas = document.getElementById("myCanvas");
canvas.width = innerWidth;
canvas.height = innerHeight;
var sandbox = new GlslCanvas(canvas);
var string_frag_code = 
`precision highp float;

uniform vec2 resolution;
uniform vec3 _camRot;
uniform vec3 _camPos;
uniform vec2 _offset;
uniform float _fov;
uniform vec2 _mouse;

const vec3 _cubeRot = vec3(0.,0.,0.);
const vec3 _cubeSize = vec3(1.,2.5,1.);
uniform sampler2D bg;
const float _eta = 1.55;

uniform sampler2D sideMap;
uniform sampler2D downMap;
uniform sampler2D topMap;
uniform sampler2D logo;

uniform sampler2D normalMap;
const float normalMapHeight = 0.3;

const float dispersion = 0.05;

const float PI = 3.1415926;
const float Deg2Rad = 0.01745329251;

uniform float Slider;

const vec2 fog = vec2(4.,9.);

vec3 rotate_z(vec3 org,float angle){
    angle *= Deg2Rad;
    float x = org.x*cos(angle) - org.y*sin(angle);
    float y = org.x*sin(angle) + org.y*cos(angle);
    float z = org.z;
    return vec3(x,y,z);
        
}
vec3 rotate_y(vec3 org,float angle){
    angle *= Deg2Rad;
    float x = org.z*sin(angle) + org.x*cos(angle);
    float z = org.z*cos(angle) - org.x*sin(angle);
    float y = org.y;
    return vec3(x,y,z);
        
}
vec3 rotate_x(vec3 org,float angle){
    angle *= Deg2Rad;
    float y = org.y*cos(angle) - org.z*sin(angle);
    float z = org.y*sin(angle) + org.z*cos(angle);
    float x = org.x;
    return vec3(x,y,z);
        
}
vec3 Rotate(vec3 org,vec3 rot){
    return rotate_z(rotate_y(rotate_x(org,rot.x),rot.y),rot.z);
}
vec3 InverseRotate(vec3 org,vec3 rot){
    return rotate_x(rotate_y(rotate_z(org,-rot.z),-rot.y),-rot.x);
}
vec3 lerp(vec3 a,vec3 b,float t){
    return (b-a)*t+a;
}
vec3 refrect(vec3 i,vec3 n,float eta){
    vec3 targetdir;
    float cosi = dot(-i,n);
    float cost2 = 1.-eta*eta*(1.-cosi*cosi);
    if(cost2<=0.0)
        targetdir = vec3(0);
    else{
        vec3 t = eta*i + ((eta*cosi - sqrt(abs(cost2)))*n);
        targetdir = normalize(t);
    }
    return targetdir;
}
float Rs(vec3 i, vec3 n, float n1,float n2) {
    i = normalize(i);
    n = normalize(n);
    float cosi = dot(-i, n);
    float sini = sqrt(1.0 - cosi * cosi);
    float cost2 = 1. - (n1*sini / n2)*(n1*sini / n2);
    if (cost2 <= 0.0)
        return 1.0;
    float tail = n2 * sqrt(cost2);
    float up = n1 * cosi - tail;
    float down = n1 * cosi + tail;
    return (up / down)*(up / down);
}
float Rt(vec3 i, vec3 n, float n1, float n2) {
    i = normalize(i);
    n = normalize(n);
    float cosi = dot(-i, n);
    float sini = sqrt(1.0 - cosi * cosi);
    float cost2 = 1. - (n1*sini / n2)*(n1*sini / n2);
    if (cost2 <= 0.0)
        return 1.0;
    float head = n1 * sqrt(cost2);
    float up = head - n2 * cosi;
    float down = head + n2 * cosi;
    return (up / down)*(up / down);
}
float fractmount(vec3 i, vec3 n, float eta) {

    float n1;
    float n2;
    if (eta > 1.0) {
        n1 = eta;
        n2 = 1.;
    }
    else {
        n1 = 1.;
        n2 = 1. / eta;
    }
    return 1. - (Rs(i, n, n1, n2) + Rt(i, n, n1, n2)) / 2.;
}
vec4 getSky(vec3 direction){
    float xpos = atan(direction.z/direction.x);
    if(direction.x<0.0){
        if(direction.z<0.0){
            xpos=xpos-PI;
        }else{
            xpos=PI+xpos;
        }
        
    }
    float ypos = atan(direction.y/sqrt(direction.x*direction.x+direction.z*direction.z));
    xpos = xpos/2.0/PI+0.5;
    ypos = (ypos/PI+0.5);
    return texture2D(bg,vec2(xpos,ypos));
}
vec3 raytracePlane(vec3 pos,vec3 dir,vec3 rot,vec2 size){
    pos = Rotate(pos,rot);
    dir = Rotate(dir,rot);
    
    float dis = 999999.0;
    
    vec2 uv = vec2(0);
    vec3 posTemp;
    vec3 endTemp;
    float disTemp;
    
    posTemp = pos;
    disTemp = posTemp.z/-dir.z;
    if(disTemp>0.0){
        endTemp = posTemp + dir*disTemp;
        if(endTemp.x>-.5*size.x && endTemp.x<.5*size.x && endTemp.y>-.5*size.y && endTemp.y<.5*size.y){
            if(disTemp<dis){
                dis = disTemp;
                uv = endTemp.xy/size.xy+vec2(0.5);                
            }
        }
    }
    
    return vec3(dis,uv);
}
vec3 raytraceGround(vec3 pos,vec3 dir,float height){

    pos-=vec3(0,height,0);
    float dis = 999999.0;
    
    vec2 uv = vec2(0);
    vec3 posTemp;
    vec3 endTemp;
    float disTemp;
    
    posTemp = pos;
    disTemp = posTemp.y/-dir.y;
    if(disTemp>0.0){
        endTemp = posTemp + dir*disTemp;
        if(disTemp<dis){
            dis = disTemp;
            uv = endTemp.xy+vec2(0.5);                
        }
    }
    
    return vec3(dis,uv);
}
vec4 raytraceCube(vec3 pos,vec3 dir,vec3 rot,vec3 size,int faceCut,inout int face,inout vec2 uv){
    pos = Rotate(pos,rot);
    dir = Rotate(dir,rot);
    
    float dis = 999999.0;
    vec3 normal = vec3(0.);
    face = -1;
    uv = vec2(0);
    vec3 posTemp;
    vec3 endTemp;
    float disTemp;
    
    if(faceCut!=0){
        posTemp = pos - vec3(0.,0.,.5)*size;
        disTemp = posTemp.z/-dir.z;
        if(disTemp>0.0){
            endTemp = posTemp + dir*disTemp;
            if(endTemp.x>-.5*size.x && endTemp.x<.5*size.x && endTemp.y>-.5*size.y && endTemp.y<.5*size.y){
                if(disTemp<dis){
                    dis = disTemp;
                    uv = endTemp.xy/size.xy+vec2(0.5);                
                    normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,-90.,0.)));
                    normal = lerp(vec3(0.,0.,1.)*sign(posTemp.z),normal,normalMapHeight);
                    face = 0;
                }
            }
        }
    }
    
    if(faceCut!=1){
        posTemp = pos - vec3(0.,0.,-.5)*size;
        disTemp = posTemp.z/-dir.z;
        if(disTemp>0.0){
            endTemp = posTemp + dir*disTemp;
            if(endTemp.x>-.5*size.x && endTemp.x<.5*size.x && endTemp.y>-.5*size.y && endTemp.y<.5*size.y){
                if(disTemp<dis){
                    dis = disTemp;
                    uv = endTemp.xy/size.xy+vec2(0.5);
                    normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,90.,0.)));
                    normal = lerp(vec3(0.,0.,1.)*sign(posTemp.z),normal,normalMapHeight);
                    face = 1;
                }
            }
        }
    }
    
    if(faceCut!=2){
        posTemp = pos - vec3(0.,.5,0.)*size;
        disTemp = posTemp.y/-dir.y;
        if(disTemp>0.0){
            endTemp = posTemp + dir*disTemp;
            if(endTemp.x>-.5*size.x && endTemp.x<.5*size.x && endTemp.z>-.5*size.z && endTemp.z<.5*size.z){
                if(disTemp<dis){
                    dis = disTemp;
                    uv = endTemp.xz/size.xz+vec2(0.5);
                    normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,0.,90.)));
                    normal = lerp(vec3(0.,1.,0.)*sign(posTemp.y),normal,normalMapHeight);
                    face = 2;
                }
            }
        }
    }
    
    if(faceCut!=3){
        posTemp = pos - vec3(0.,-.5,0.)*size;
        disTemp = posTemp.y/-dir.y;
        if(disTemp>0.0){
            endTemp = posTemp + dir*disTemp;
            if(endTemp.x>-.5*size.x && endTemp.x<.5*size.x && endTemp.z>-.5*size.z && endTemp.z<.5*size.z){
                if(disTemp<dis){
                    dis = disTemp;
                    uv = endTemp.xz/size.xz+vec2(0.5);
                    normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,0.,-90.)));
                    normal = lerp(vec3(0.,1.,0.)*sign(posTemp.y),normal,normalMapHeight);
                    face = 3;
                }
            }
        }
    }
    
    if(faceCut!=4){
        posTemp = pos - vec3(.5,0.,0.)*size;
        disTemp = posTemp.x/-dir.x;
        if(disTemp>0.0){
            endTemp = posTemp + dir*disTemp;
            if(endTemp.y>-.5*size.y && endTemp.y<.5*size.y && endTemp.z>-.5*size.z && endTemp.z<.5*size.z){
                if(disTemp<dis){
                    dis = disTemp;
                    uv = endTemp.zy/size.zy+vec2(0.5);
                    normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,0.,0.)));
                    normal = lerp(vec3(1.,0.,0.)*sign(posTemp.x),normal,normalMapHeight);
                    face = 4;
                }
            }
        }
    }
    
    if(faceCut!=5){
        posTemp = pos - vec3(-.5,0.,0.)*size;
        disTemp = posTemp.x/-dir.x;
        if(disTemp>0.0){
            endTemp = posTemp + dir*disTemp;
            if(endTemp.y>-.5*size.y && endTemp.y<.5*size.y && endTemp.z>-.5*size.z && endTemp.z<.5*size.z){
                if(disTemp<dis){
                    dis = disTemp;
                    uv = endTemp.zy/size.zy+vec2(0.5);
                    normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,180.,0.)));
                    normal = lerp(vec3(1.,0.,0.)*sign(posTemp.x),normal,normalMapHeight);
                    face = 5;
                }
            }
        }
    }
    
    return vec4(dis,InverseRotate(normal,rot));
}
vec4 AlphaBlend(vec4 front,vec4 back){
    return front*front.w+back*(1.0-front.w);
}
vec4 Cube(vec3 pos,vec3 dir,vec3 cubePos,vec3 cubeRot,vec3 cubeSize,int cubeIndex,float planeRot,inout bool hit){

    int face;
    vec2 uv;
    vec4 raycastCube = raytraceCube(pos-cubePos,dir,cubeRot,cubeSize,-1,face,uv);
    vec3 mypos=pos + raycastCube.x*dir;
    float dis = raycastCube.x;
    float alpha = 1.0;
    vec3 raytraceGround = raytraceGround(pos,dir,-cubeSize.y*.5);
    if(raytraceGround.x<raycastCube.x){
        pos+=dir*raytraceGround.x;
        dir = reflect(dir,vec3(0,1,0));
        raycastCube = raytraceCube(pos-cubePos,dir,cubeRot,cubeSize,-1,face,uv);
        mypos= pos + raycastCube.x*dir;
        dis = (raytraceGround.x+raycastCube.x);
        alpha = (1.0-(mypos.y+cubeSize.y*.5)/2.5)*0.2;
    }
    
    hit = raycastCube.x<999998.0;
    if(!hit)
        return vec4(0.);
    
    vec4 reflectColor = getSky(reflect(dir,raycastCube.yzw))*5.0;
    vec4 finalColor = vec4(0);
    for(int i=0;i!=3;i++){
        float myEta = _eta;
        if(i==0)
            myEta *= 1.0-dispersion;
        if(i==2)
            myEta *= 1.0+dispersion;
        
        vec3 mydir = dir;
        float refelectRatio = fractmount(mydir,raycastCube.yzw,1.0/myEta);
        
        vec2 Myuv;
        int Myface;

        mydir = refrect(mydir,raycastCube.yzw,1.0/myEta);
        
        
        vec4 insideColor = vec4(0.);
        vec4 frontColor = vec4(0.);
        
        vec3 raytracePlane = raytracePlane(mypos-cubePos,mydir,vec3(0,planeRot,0),vec2(min(cubeSize.x,cubeSize.z),min(cubeSize.x,cubeSize.z)*2.0));
        bool hitLogo = false;
        if(raytracePlane.x<999998.0){
            vec4 logoPixel = texture2D(logo,raytracePlane.yz);
            if(logoPixel.w>0.5){
                frontColor = logoPixel;
            }
        }

        vec4 myRaycastCube = raytraceCube(mypos-cubePos,mydir,cubeRot,cubeSize,face,Myface,Myuv);
        if(Myface==2)
            insideColor = texture2D(topMap,Myuv);
        else if(Myface==3)
            insideColor = texture2D(downMap,Myuv)*0.25;
        else{
            insideColor = texture2D(sideMap,Myuv)*0.25;
        }
        insideColor = AlphaBlend(frontColor,insideColor);
        
        
        if(i==0){
            finalColor += (reflectColor*(1.0-refelectRatio)+insideColor*(refelectRatio)) * vec4(1.,0.,0.,1.);
        }
        else if(i==1){
            finalColor += (reflectColor*(1.0-refelectRatio)+insideColor*(refelectRatio)) * vec4(0.,1.,0.,1.);
        }
        else{
            finalColor += (reflectColor*(1.0-refelectRatio)+insideColor*(refelectRatio)) * vec4(0.,0.,1.,1.);
        }
    }
    dis = 1.0-clamp((dis-fog.x)/(fog.y-fog.x),0.,1.);
    return vec4(finalColor.xyz*dis*alpha,1);
}
void main(void)
{
    vec3 camPos = _camPos;
    vec3 camAng = _camRot;
    
    vec2 mouse = _mouse.xy-vec2(.5);
    camAng += vec3((mouse.yx)*vec2(10.0,15.0),0);
    camPos = Rotate(camPos,camAng);
    float aspect = resolution.y/resolution.x;
    
    
    
    vec2 uv = -1. + 2. * (gl_FragCoord.xy/resolution.xy) + _offset;
    vec3 dir = Rotate(Rotate(vec3(0.0,0.0,1.0),vec3(-uv.y*_fov*0.5*aspect,uv.x*_fov*0.5,0.0)),camAng);

    bool hit;
    float mySlider = mod(Slider,4.0);
    

    for(int i=2;i!=-7;i--){
        vec3 mypos = vec3(1.5,0,-1.5)*float(i);
        mypos += vec3(1.5,0,-1.5)*mySlider;
        
        vec3 myrot = _cubeRot + vec3(0.,1.,0)*(float(i)+mySlider)*-60.0;
        
        gl_FragColor = Cube(camPos,dir,mypos,myrot,_cubeSize,-1,-camAng.y,hit);
        if(hit)
            return;
    }
}

`;
sandbox.load(string_frag_code);
sandbox.setUniform("resolution",canvas.width,canvas.height);
sandbox.setUniform("_mouse",0.5,0.5);
sandbox.setUniform("_camRot",0.0,0.0,0.0);
sandbox.setUniform("_camPos",0.0,0.0,-4.3);
sandbox.setUniform("_offset",-0.4,0.0);
sandbox.setUniform("_fov",90.0);

sandbox.setUniform("bg","bg.png");
sandbox.setUniform("topMap","topMap.png");
sandbox.setUniform("sideMap","sideMap.png");
sandbox.setUniform("downMap","downMap.png");
sandbox.setUniform("logo","TestLogo.png");
sandbox.setUniform("normalMap","normalMap.png");



var LightPos = [0,0];
var TargetPos = [0,0];
var StartTouchPos = [0,0];

var Slider = 0.0;
var mySlider = 0.0;

var lastTick = performance.now()
function tick(nowish) {
  var delta = nowish - lastTick
  lastTick = nowish
  update(delta);
  window.requestAnimationFrame(tick)
}
window.requestAnimationFrame(tick)


function update(delta){
    LightPos[0] = (TargetPos[0]-LightPos[0])*delta/500.0 + LightPos[0];
    LightPos[1] = (TargetPos[1]-LightPos[1])*delta/500.0 + LightPos[1];
    mySlider = (Math.floor(Slider)-mySlider)*delta/500.0  + mySlider;
    sandbox.setUniform("_mouse",LightPos[0],LightPos[1]);
    sandbox.setUniform("Slider",mySlider);
}

document.onmousemove = function(e){
    var MousePos = [e.pageX/window.innerWidth, e.pageY/window.innerHeight];
    TargetPos = MousePos;
}
document.ontouchstart = function(e){
    StartTouchPos = [e.pageX/window.innerWidth, e.pageY/window.innerHeight];
}
document.ontouchmove = function(e){
    var TouchPos = [e.pageX/window.innerWidth, e.pageY/window.innerHeight];
    TargetPos[0] = TargetPos[0] + TouchPos[0]-StartTouchPos[0];
    TargetPos[1] = TargetPos[1] + TouchPos[1]-StartTouchPos[1];
    StartTouchPos = TouchPos;
}
document.onmousewheel = function(e){
    Slider += e.wheelDelta*0.005;
}

window.onresize = function(e){
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    sandbox.setUniform("resolution",canvas.width,canvas.height);

}
