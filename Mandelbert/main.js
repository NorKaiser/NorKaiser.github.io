var canvas = document.getElementById("myCanvas");
var sandbox = new GlslCanvas(canvas);
var string_frag_code = 
`precision mediump float;

uniform vec2 resolution;
uniform vec3 _camRotate;
uniform vec3 _camPos;
uniform vec3 _lightpos;
uniform float _fov;
uniform vec2 _mousepos;

uniform float _lightIntensity;
uniform float _shadowStrength;
const int _maxStep = 128;
const int _iteration = 20;
uniform float _power;
uniform vec3 _c;
const float _accuracy = 3.0;

uniform float _ao;
uniform float _diffuse;
uniform float _specular;
uniform float _specularPower;


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
float geta(float d, float r) {
    return asin(r/d) * 180.0 / 3.1415;
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
vec4 BlinnPhong(vec3 lightDir,vec3 viewDir,vec3 normal,float ao,float shadow) {
    lightDir = normalize(lightDir);
    viewDir = normalize(viewDir);
    normal = normalize(normal);
    vec3 h = normalize(lightDir + viewDir);
    float diffuse = dot(normal, lightDir);
    float specular = clamp(dot(h, normal),0.0,1.0);
    specular = pow(specular, _specularPower);
    ao = (1.0 - _ao) + ao * _ao;
    diffuse = (1.0 - _diffuse) + diffuse * _diffuse;
    specular = _specular* specular*shadow;


    float r = ao * shadow*diffuse + specular;
    vec4 c = vec4(r,r,r, 1);
    return c;
}
float getshadow(vec3 p,vec3 lightPos,vec3 c) {
    vec3 from = lightPos;
    vec3 direction = normalize(p - lightPos);
    
    if(length(from)>2.0){
        float ptoc = (dot(-from,normalize(direction)));
        vec3 c = ptoc*direction+from;
        if(length(c)>2.0){
            return 0.0;
        }
        float ctoa = sqrt(4.0-length(c));
        from = from+direction*(ptoc-ctoa);
    }

    float totalDistance = 0.0;
    float a = 90.0;
    int steps = 0;
    for (int steps_i = 0; steps_i < _maxStep; steps_i++) {
        vec3 pn = from + totalDistance * direction;
        float distance = DE(pn,c);
        float na = abs(geta(length(p - pn), distance));
        if (na < a)
            a = na;
        totalDistance += distance;
        if (distance < 1.0 / (pow(10.0, _accuracy))){
            break;
        }
        steps++;
    }
    float sha = a/90.0;
    sha = sha * _lightIntensity;
    sha = sha / totalDistance / totalDistance;
    sha = (1.0 - _shadowStrength) + sha * _shadowStrength;
    return sha;
}

vec4 raymarch(vec3 from, vec3 direction,vec3 lightPos,vec3 c) {
    float totalDistance = 0.0;

    int steps = 0;
    vec3 p;

    for (int steps_i = 0; steps_i < _maxStep; steps_i++) {
        p = from + totalDistance * direction;
        float distance = DE(p,c);
        totalDistance += distance;
        if (distance < 1.0/(pow(10.0,_accuracy))){
            break;
        }
        steps ++;
    }

    float col = 1.0 - float(steps) / float(_maxStep);
    if (steps == _maxStep)
        return vec4(0,0,0,1);

    float dis = length(p - lightPos);

    float a = 90.0;
    float sha = 0.0;

    if (_lightIntensity != 0.0 && _shadowStrength != 0.0) {
        sha = getshadow(p,lightPos,c);
    }

    vec3 normal = getn(p, 1.0 / (pow(10.0, _accuracy)),c);


    vec4 color = BlinnPhong(lightPos-p, from-p, normal, col, sha);

    return color;
}
bool raycastSphere(vec3 pos,float rad,vec3 ro,vec3 rd){
    float ptoc = (dot(pos-ro,normalize(rd)));
    if(ptoc<0.0){
        return false;
    }
    vec3 c = ptoc*rd+ro;
    if(length(c-pos)>rad){
        return false;
    }
    return true;
}
void main(void)
{
    vec3 camPos = _camPos;
    vec3 camAng = _camRotate;
    camAng = vec3(camAng.x+_mousepos.y*20.0,camAng.y+_mousepos.x*20.0,camAng.z);
    camPos = Rotate(camPos,camAng);
    float aspect = resolution.y/resolution.x;
    
    vec2 uv = -1. + 2. * (gl_FragCoord.xy/resolution.xy);
    vec3 dirSphere = Rotate(Rotate(vec3(0.0,0.0,1.0),vec3(-uv.y*_fov*0.5*aspect,uv.x*_fov*0.5,0.0)),camAng);
    
    float w = sin(_fov*3.1415/180.0*0.5);
    float h = w*aspect;
    vec3 cam_forward =  Rotate(vec3(0.0,0.0,1.0),camAng);
    vec3 cam_right =  Rotate(vec3(1.0,0.0,0.0),camAng);
    vec3 cam_up =  Rotate(vec3(0.0,1.0,0.0),camAng);
    vec3 dirPlane = normalize(cam_forward+cam_right*uv.x*w+cam_up*uv.y*h);
    vec3 dir = dirPlane;

        
    vec3 lightPos = vec3(_lightpos.x + _mousepos.x*1.5,_lightpos.y-_mousepos.y*3.0,_lightpos.z); 
    vec3 c = vec3(_c.x + _mousepos.y*0.3,_c.y+_mousepos.x*0.3,_c.z);

    /*if(raycastSphere(lightPos,0.25,camPos,dir)){
        gl_FragColor = vec4(1,1,1,1);
        return;
    }*/

    if(length(camPos)>2.0){
        float ptoc = (dot(-camPos,normalize(dir)));
        if(ptoc<0.0){
            gl_FragColor = vec4(0,0,0,1);
            return;
        }
        vec3 c = ptoc*dir+camPos;
        if(length(c)>2.0){
            gl_FragColor = vec4(0,0,0,1);
            return;
        }
        float ctoa = sqrt(4.0-length(c));
        camPos = camPos+dir*(ptoc-ctoa);
    }

    gl_FragColor = raymarch(camPos,dirPlane,lightPos,c);

}

`;
sandbox.load(string_frag_code);
sandbox.setUniform("resolution",720*window.innerWidth/window.innerHeight,720);
sandbox.setUniform("_camRotate",5.0,20.0,0.0);
sandbox.setUniform("_camPos",0.0,0.0,-4.0);
sandbox.setUniform("_lightpos",2,4,-3.0);
sandbox.setUniform("_fov",100.0);
sandbox.setUniform("_lightIntensity",15.0);
sandbox.setUniform("_shadowStrength",1.0);
sandbox.setUniform("_power",2.0);
sandbox.setUniform("_ao",1.0);
sandbox.setUniform("_diffuse",1.0);
sandbox.setUniform("_specular",1.0);
sandbox.setUniform("_specularPower",5.0);
sandbox.setUniform("_c",0.026315808,0.70175433,0.71052635);

window.addEventListener("resize", resizeCanvas, false);
function resizeCanvas() {
    sandbox.setUniform("resolution",720*window.innerWidth/window.innerHeight,720);
}


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
    sandbox.setUniform("_mousepos",LightPos[0],LightPos[1]);
}
canvas.onmousedown = function(e){

}
canvas.onmouseup = function(e){

}
canvas.onmousemove = function(e){
    MousePos = getPointOnCanvas(canvas, e.pageX, e.pageY);
}
canvas.ontouchmove = function(e){
    MousePos = getPointOnCanvas(canvas, e.pageX, e.pageY);
}

function getPointOnCanvas(canvas, x, y) {
    var bbox =canvas.getBoundingClientRect();
    return [(x- bbox.left)  / bbox.width - 0.5,(y - bbox.top)  / bbox.height - 0.5];
 
 }
