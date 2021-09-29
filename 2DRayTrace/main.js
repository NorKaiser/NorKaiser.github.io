var canvas = document.getElementById("myCanvas");
var sandbox = new GlslCanvas(canvas);
var string_frag_code = 
`precision mediump float;

const float Brightness = 4.0;
const int Samplers = 64;
const int MaxStep = 4;
const float CLightR = 0.04;
const vec3 CLight = vec3(1.0,1.0,1.0);
uniform float LogoSize;
uniform float Reta;
vec2 _mouse;
uniform vec2 Mouse;
uniform vec2 resolution;
uniform float dispersion;
uniform sampler2D _dither;
uniform float Rot;
uniform float Attenuation;
uniform sampler2D LogoMap;

vec2 rotate(vec2 p,float a){
    float s = p.x*cos(a)-p.y*sin(a);
    float t = p.x*sin(a) + p.y*cos(a);
    return vec2(s,t);
}
bool insideCube(vec2 pos){
    float rot = Rot*2.*3.1415926/360.;
    vec2 newpos = pos;
    newpos = rotate(newpos,-rot);
    bool insideCube =   (newpos.x<=LogoSize*0.5)&& 
                        (newpos.x>=LogoSize*-0.5)&& 
                        (newpos.y<=LogoSize*0.5)&& 
                        (newpos.y>=LogoSize*-0.5);
    return  insideCube;
}
bool logoTemp(int X,int Y){
    return texture2D(LogoMap,vec2((float(X)+0.5)/15.,(float(Y)+0.5)/15.)).r>0.5;
}
bool insideLogo(vec2 pos){
    float rot = Rot*2.*3.1415926/360.;
    if(!insideCube(pos))
        return  false;
    vec2 mypos = rotate(pos,-rot);
    int nowX = int(floor((mypos.x/LogoSize+0.5)*15.));
    int nowY = int(floor((mypos.y/LogoSize+0.5)*15.));
    if(logoTemp(nowX,nowY)){
        return true;
    }
    return false;
}
vec3 rayCircle(vec2 pos,vec2 dir,vec2 Cpos,float Cr){
    float dis;
    vec2 normal;

    
    vec2 ndir = normalize(dir);
    vec2 ctoo = Cpos-pos;
    float d2 = dot(ctoo,ndir);
    float d = length(ndir*d2-ctoo);

    if(d>Cr){
        dis = 999999.0;
        return vec3(dis,normal.xy);
    }
    float m = sqrt(Cr*Cr-d*d);
    float minpos = min(d2+m,d2-m);
    float maxpos = max(d2+m,d2-m);
    if(maxpos<0.0){
        dis = 999999.0;
        return vec3(dis,normal.xy);
    }
    if(minpos<0.0){
        dis = maxpos;
        //dis = 0;
        normal = normalize(ndir*dis-ctoo);
        normal = vec2(-normal.x,-normal.y);
        return vec3(dis,(normal).xy);
    }
    dis = minpos;
    normal = normalize(ndir*dis-ctoo);
    
    return vec3(dis,normal.xy);
}


vec3 rayLine(vec2 pos,vec2 dir,vec2 a,vec2 b){
    vec2 v1 = pos-a;
    vec2 v2 = b-a;
    vec2 v3 = vec2(-dir.y,dir.x);
    float t2 = dot(v1,v3)/dot(v2,v3);
    if(t2<0.0 || t2>1.0)
        return vec3(999999,0,0);
    vec2 x = a+(b-a)*t2;
    vec2 ptox = x-pos;
    if(dot(ptox,dir)<0.0)
        return vec3(999999,0,0);
    vec2 normal = normalize(vec2(-v2.y,v2.x));
    if(dot(v1,normal)<0.0)
        normal = -normal;
    return vec3(length(ptox),normal.xy);
}
vec3 rayRect(vec2 pos,vec2 dir){
    vec2 normal;
    float dis = 999999.0;
    float rot = Rot*2.*3.1415926/360.;
    vec2 v1 = rotate(vec2(0.5,0.5)*LogoSize,rot);
    vec2 v2 = rotate(vec2(0.5,-0.5)*LogoSize,rot);
    vec2 v3 = rotate(vec2(-0.5,-0.5)*LogoSize,rot);
    vec2 v4 = rotate(vec2(-0.5,0.5)*LogoSize,rot);

    vec3 n = rayLine(pos,dir,v1,v2);
    if(n.x<dis){
        dis = n.x;
        normal = n.yz;
    }
    n = rayLine(pos,dir,v2,v3);
    if(n.x<dis){
        dis = n.x;
        normal = n.yz;
    }
    n = rayLine(pos,dir,v3,v4);
    if(n.x<dis){
        dis = n.x;
        normal = n.yz;
    }
    n = rayLine(pos,dir,v4,v1);
    if(n.x<dis){
        dis = n.x;
        normal = n.yz;
    }

    if(dis>=999998.0)
        return vec3(999999,0,0);
    return vec3(dis,normal.xy);
}


float random(in vec2 coordinate){
    return fract(sin(dot(coordinate,vec2(12.9898,78.233))) * 43758.5453);
}
vec4 getCollide(vec2 pos,vec2 dir){
    float mindis = 999999.0;
    int index = -1;
    int shape = -1;
    
        vec3 collide = rayCircle(pos,dir,_mouse,CLightR);
        float dis = collide.x;
        if(dis<mindis){
            shape = 0;
            mindis = dis;
        }
        
        collide = rayRect(pos,dir);
        dis = collide.x;
        if(dis<mindis){
            shape = 1;
            mindis = dis;
        }
    return vec4(shape,mindis,collide.yz);
}
vec2 refrect(vec2 i,vec2 n,float eta){
    vec2 targetdir;
    float cosi = dot(-i,n);
    float cost2 = 1.-eta*eta*(1.-cosi*cosi);
    if(cost2<=0.0)
        targetdir = vec2(0);
    else{
        vec2 t = eta*i + ((eta*cosi - sqrt(abs(cost2)))*n);
        targetdir = normalize(t);
    }
    return targetdir;
}

bool insideCircle(vec2 pos,int k){
    float l = length(pos - _mouse);
    return l<= CLightR;
}
void main()
{
    float dither = texture2D(_dither,fract(gl_FragCoord.xy/64.0)).r;


    float aspect =  resolution.x/resolution.y; 
    vec2 mypos = gl_FragCoord.xy/resolution.xy;
    mypos-=vec2(.5);
    mypos = vec2(mypos.x*aspect,mypos.y);
    vec3 light = vec3(0);
    _mouse = (Mouse-vec2(0.5))*vec2(aspect,1.0);
    


    for(int j = 0;j!=Samplers;j++){
        //for(int colornow = 0;colornow!=3;colornow++){
            //float dispersionIndex = (1.0+(float(colornow)-1.0)*dispersion);
            float dispersionIndex = 1.0;
            float angle = float(j)/float(Samplers);
            //angle += random(mypos)*(1./float(Samplers));
            angle += (dither+random(mypos+vec2(j)))*(1./float(Samplers));
            angle *= 2.*3.1415926;
            vec2 dir = vec2(cos(angle),sin(angle));
            vec2 pos = mypos;
            float intensity = 1.0;
            for(int i = 0;i!=MaxStep;i++){
                vec4 collide = getCollide(pos,dir);
                if(collide.x<0.0){
                    break;
                }
                if(collide.x==0.0){
                    light += CLight*Brightness/float(Samplers);
                    /*if(colornow==0)
                        light += intensity * CLight*Brightness*vec3(1.,0.,0.)/float(Samplers);
                    if(colornow==1)
                        light += intensity * CLight*Brightness*vec3(0.,1.,0.)/float(Samplers);
                    if(colornow==2)
                        light += intensity * CLight*Brightness*vec3(0.,0.,1.)/float(Samplers);*/
                    break;
                }else if(collide.x==1.0){
                    //light += RLight.yzw*Brightness/float(Samplers);
                    vec3 collidePar = collide.yzw;
                    float dis = collidePar.x;
                    vec2 normal = collidePar.yz;
                    pos = pos + dir*dis;
                    if(Reta==0.0)
                        dir = reflect(dir,normal);
                    else{
                        vec2 oldpos = pos-dir*dis;
                        vec2 newdir;
                        
                        if(insideCube(oldpos))
                            newdir = refrect(dir,normal,Reta * dispersionIndex);
                        else
                            newdir = refrect(dir,normal, dispersionIndex/Reta);
                        
                
                        if(newdir==vec2(0))
                            dir = reflect(dir,normal);
                        else
                            dir = newdir;
                    }
                    pos = pos + dir*0.00001;
                }
                intensity*=Attenuation;
            //}
        }
        
    }
    vec4 color = vec4(light.xyz,1);
    gl_FragColor = color;
    
    /*if(insideLogo(mypos)){
        gl_FragColor = vec4(1) - color;
        return;
    }*/
}


`;


sandbox.load(string_frag_code);
sandbox.setUniform("resolution",window.innerWidth/2,window.innerHeight/2);
sandbox.setUniform("Reta",1.55);
sandbox.setUniform("LogoSize",0.2);
sandbox.setUniform("Par",64,8,6);
sandbox.setUniform("dispersion",0.1);
sandbox.setUniform("Rot",45);
sandbox.setUniform("Attenuation",1.0);
sandbox.setUniform("_dither","Dither.png");
sandbox.setUniform("LogoMap","Logo_1px.png");

window.addEventListener("resize", resizeCanvas, false);
function resizeCanvas() {
    sandbox.setUniform("resolution",window.innerWidth/2,window.innerHeight/2);
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
    sandbox.setUniform("Mouse",LightPos[0],LightPos[1]);
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
    return [(x- bbox.left)  / bbox.width,1-(y - bbox.top)  / bbox.height];
 
 }
