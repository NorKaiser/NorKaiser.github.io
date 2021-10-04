var canvas = document.getElementById("myCanvas");
var sandbox = new GlslCanvas(canvas);
var string_frag_code = 
`precision highp float;

uniform vec2 resolution;
uniform vec3 _camRotate;
uniform vec3 _camPos;
uniform float _fov;
uniform vec2 _mouse;


const int _maxStep = 256;
const int _iteration = 20;
uniform float _power;
uniform vec3 _c;
const float _accuracy = 3.3;

uniform vec3 _cubeRot;
uniform sampler2D bg;
const float _eta = 2.417;
const float _cubeSize = 2.3;


vec3 rotate_z(vec3 org,float angle){
    angle *= 3.1415/180.0;
    float x = org.x*cos(angle) - org.y*sin(angle);
    float y = org.x*sin(angle) + org.y*cos(angle);
    float z = org.z;
    return vec3(x,y,z);
        
}
vec3 rotate_y(vec3 org,float angle){
    angle *= 3.1415/180.0;
    float x = org.z*sin(angle) + org.x*cos(angle);
    float z = org.z*cos(angle) - org.x*sin(angle);
    float y = org.y;
    return vec3(x,y,z);
        
}
vec3 rotate_x(vec3 org,float angle){
    angle *= 3.1415/180.0;
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
float Mandelbulb(vec3 poso,vec3 c) {
    float _nx = _power * 2.0;
    vec3 pos = vec3(poso.x, poso.z, poso.y);
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < _iteration; i++) {
        r = length(z);
        if (r > 3.0)
            break;
        float theta = acos(z.z / r);
        float phi = atan(z.y/z.x);
        dr = pow(r, _nx - 1.0) * _nx * dr + 1.0;

        float zr = pow(r, _nx);
        theta = theta * _nx;
        phi = phi * _nx;

        z = zr * vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
        z += c;
    }
    float dis = 0.5*log(r)*r / dr;
    return dis;
}
float DE(vec3 pos,vec3 c) {
    //return length(pos)-1.0;
    float b = Mandelbulb(pos,c);
    return b;
}

vec3 getn(vec3 pos,float dir,vec3 c) {
    vec3 xdir = vec3(dir, 0, 0);
    vec3 ydir = vec3(0, dir, 0);
    vec3 zdir = vec3(0, 0, dir);
    vec3 n = normalize(vec3(DE(pos + xdir,c) - DE(pos - xdir,c),
        DE(pos + ydir,c) - DE(pos - ydir,c),
        DE(pos + zdir,c) - DE(pos - zdir,c)));
    return n;
}

vec4 raymarch(vec3 from, vec3 direction,vec3 c) {
    float totalDistance = 0.0;

    int steps = 0;
    vec3 p;

    for (int steps_i = 0; steps_i < _maxStep; steps_i++) {
        p = from + totalDistance * direction;
        float distance = DE(p,c);
        //distance *= (1.0-dither*0.1);
        totalDistance += distance;
        if (distance < 1.0/(pow(10.0,_accuracy))){
            break;
        }
        steps ++;
    }
    
    if (steps == _maxStep)
        return vec4(0,0,0,1);
    
    float col = pow(float(steps) / float(_maxStep),0.9);
    
    vec4 color = vec4(col,col,col,1.0);
    return color;
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
float RefelectRatio(vec3 i,vec3 n,float eta){
    /*float C = dot(normalize(-i),normalize(n));
    float S = sqrt(1.0-C*C);
    float St = _eta*S;
    float thi = asin(S);
    float tht = asin(St);
    float R1 = pow(sin(tht-thi)/sin(tht+thi),2.0);
    float R2 = pow(tan(tht-thi)/tan(tht+thi),2.0);*/
    return pow(1.0-dot(n,-i),2.0);
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
            xpos=xpos-3.14159;
        }else{
            xpos=3.14159+xpos;
        }
        
    }
    float ypos = atan(direction.y/sqrt(direction.x*direction.x+direction.z*direction.z));
    xpos = xpos/2.0/3.14159+0.5;
    ypos = 1.0-(ypos/3.14159+0.5);
    return texture2D(bg,vec2(xpos,ypos));
}
vec4 raytraceCube(vec3 pos,vec3 dir,vec3 Rotation,float size){
    pos = Rotate(pos,Rotation)/size;
    dir = Rotate(dir,Rotation);
    
    float dis = 999999.0;
    vec3 normal = vec3(0.);
    vec3 posTemp;
    vec3 endTemp;
    float disTemp;
    
    posTemp = pos - vec3(0.,0.,-.5);
    disTemp = posTemp.z/-dir.z;
    if(disTemp>0.0){
        endTemp = posTemp + dir*abs(disTemp);
        if(endTemp.x>-.5 && endTemp.x<.5 && endTemp.y>-.5 && endTemp.y<.5){
            if(abs(disTemp)<dis){
                dis = abs(disTemp);
                normal = vec3(0.,0.,-1.);
            }
        }
    }
    
    posTemp = pos - vec3(0.,0.,.5);
    disTemp = posTemp.z/-dir.z;
    if(disTemp>0.0){
        endTemp = posTemp + dir*abs(disTemp);
        if(endTemp.x>-.5 && endTemp.x<.5 && endTemp.y>-.5 && endTemp.y<.5){
            if(abs(disTemp)<dis){
                dis = abs(disTemp);
                normal = vec3(0.,0.,1.);
            }
        }
    }
    
    posTemp = pos - vec3(0.,.5,0.);
    disTemp = posTemp.y/-dir.y;
    if(disTemp>0.0){
        endTemp = posTemp + dir*abs(disTemp);
        if(endTemp.x>-.5 && endTemp.x<.5 && endTemp.z>-.5 && endTemp.z<.5){
            if(abs(disTemp)<dis){
                dis = abs(disTemp);
                normal = vec3(0.,1.,0.);
            }
        }
    }
    
    posTemp = pos - vec3(0.,-.5,0.);
    disTemp = posTemp.y/-dir.y;
    if(disTemp>0.0){
        endTemp = posTemp + dir*abs(disTemp);
        if(endTemp.x>-.5 && endTemp.x<.5 && endTemp.z>-.5 && endTemp.z<.5){
            if(abs(disTemp)<dis){
                dis = abs(disTemp);
                normal = vec3(0.,-1.,0.);
            }
        }
    }
    
    posTemp = pos - vec3(.5,0.,0.);
    disTemp = posTemp.x/-dir.x;
    if(disTemp>0.0){
        endTemp = posTemp + dir*abs(disTemp);
        if(endTemp.y>-.5 && endTemp.y<.5 && endTemp.z>-.5 && endTemp.z<.5){
            if(abs(disTemp)<dis){
                dis = abs(disTemp);
                normal = vec3(1.,0.,0.);
            }
        }
    }
    
    posTemp = pos - vec3(-.5,0.,0.);
    disTemp = posTemp.x/-dir.x;
    if(disTemp>0.0){
        endTemp = posTemp + dir*abs(disTemp);
        if(endTemp.y>-.5 && endTemp.y<.5 && endTemp.z>-.5 && endTemp.z<.5){
            if(abs(disTemp)<dis){
                dis = abs(disTemp);
                normal = vec3(-1.,0.,0.);
            }
        }
    }
    
    return vec4(dis*size,InverseRotate(normal,Rotation));
}

void main(void)
{
    vec3 camPos = _camPos;
    vec3 camAng = _camRotate;
    
    camAng = vec3(camAng.x+(_mouse.y-0.5)*180.0,camAng.y+(_mouse.x-0.5)*360.0,camAng.z);
    camPos = Rotate(camPos,camAng);
    float aspect = resolution.y/resolution.x;
    
    vec3 c = _c+(vec3(0,_mouse)-vec3(0,0.5,0.5))*0.5;

    
    vec2 uv = -1. + 2. * (gl_FragCoord.xy/resolution.xy);
    vec3 dirSphere = Rotate(Rotate(vec3(0.0,0.0,1.0),vec3(-uv.y*_fov*0.5*aspect,uv.x*_fov*0.5,0.0)),camAng);
    
    float w = sin(_fov*3.1415/180.0*0.5);
    float h = w*aspect;
    vec3 cam_forward =  Rotate(vec3(0.0,0.0,1.0),camAng);
    vec3 cam_right =  Rotate(vec3(1.0,0.0,0.0),camAng);
    vec3 cam_up =  Rotate(vec3(0.0,1.0,0.0),camAng);
    vec3 dirPlane = normalize(cam_forward+cam_right*uv.x*w+cam_up*uv.y*h);
    vec3 dir = dirPlane;
    

    vec4 raycastCube = raytraceCube(camPos,dir,_cubeRot,_cubeSize);
    if(raycastCube.x>999998.0){
        gl_FragColor = vec4(0,0,0,1);
        return;
    }

    vec4 reflectColor = getSky(reflect(dir,raycastCube.yzw));
    float refelectRatio = fractmount(dir,raycastCube.yzw,1.0/_eta);
    
    camPos += dir*raycastCube.x;
    dir = refract(dir,raycastCube.yzw,1.0/_eta);
    vec4 remarchColor = raymarch(camPos,dir,c);
    gl_FragColor = reflectColor*(1.0-refelectRatio)+remarchColor*(refelectRatio);

}

`;
sandbox.load(string_frag_code);
sandbox.setUniform("resolution",canvas.width,canvas.height);
sandbox.setUniform("_camRotate",5.0,20.0,0.0);
sandbox.setUniform("_camPos",0.0,0.0,-9.0);
sandbox.setUniform("_fov",27.0);
sandbox.setUniform("_power",2.0);
sandbox.setUniform("_c",0.026315808,0.70175433,0.71052635);
sandbox.setUniform("bg","bg.png");



var LightPos = [0,0];
var MousePos = [0,0];

var lastTick = performance.now()
function tick(nowish) {
  var delta = nowish - lastTick
  lastTick = nowish
  update(delta);
  window.requestAnimationFrame(tick)
}
window.requestAnimationFrame(tick)


function update(delta){
    LightPos[0] = (MousePos[0]-LightPos[0])*delta/500.0 + LightPos[0];
    LightPos[1] = (MousePos[1]-LightPos[1])*delta/500.0 + LightPos[1];
    sandbox.setUniform("_mouse",LightPos[0],LightPos[1]);
}

document.onmousemove = function(e){
    MousePos = [e.pageX/window.innerWidth, e.pageY/window.innerHeight];
}
document.ontouchmove = function(e){
    MousePos = [e.pageX/window.innerWidth, e.pageY/window.innerHeight];
}
