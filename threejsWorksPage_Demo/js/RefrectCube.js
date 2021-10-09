import * as THREE from '../three/build/three.module.js'

import {
	Vector2,
	Vector3,
} from '../three/build/three.module.js';

const RefrectCube = {

	uniforms: {

		'tDiffuse': { value: null },
		'_aspect': { type: 'f',value: 1.0},
		'_camRot': { type: 'v3',value: new Vector3( 0, 0, 0 ) },
		'_camPos': { type: 'v3',value: new Vector3( 0, 0, -4.3 ) },
		'_fov': { type: 'f',value: 45.0 },
		'_mouse': { type: 'v2',value: new Vector2( 0.5, 0.5 ) },
		'_offset': { type: 'v2',value: new Vector2( -0.4, 0.0 ) },

		'_cubeRot': { type: 'v3',value: new Vector3( 0, 0, 0 ) },
		'_cubeSize': { type: 'v3',value: new Vector3( 1, 2.5, 1 ) },

		'bg': { type: 't', value: null },
		'sideMap': { type: 't',value: null },
		'downMap': { type: 't',value: null },
		'topMap': { type: 't',value: null },

		'_eta': { type: 'f',value: 1.55 },
		'normalMap': { type: 't',value: null },
		'_normalMapHeight': { type: 'f',value: 0.3 },
		'_dispersion': { type: 'f',value: 0.05 },
		'_fog': { type: 'v3',value: new Vector2( 4., 6.5 ) },

		'_slider': { type: 'f',value: 0.0 }
		
	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

	precision highp float;

	varying vec2 vUv;
	uniform sampler2D tDiffuse;

	uniform float _aspect;
	uniform vec3 _camRot;
	uniform vec3 _camPos;
	uniform float _fov;
	uniform vec2 _mouse;
	uniform vec2 _offset;
	
	uniform vec3 _cubeRot;
	uniform vec3 _cubeSize;
	uniform sampler2D bg;
	uniform float _eta;
	
	uniform sampler2D sideMap;
	uniform sampler2D downMap;
	uniform sampler2D topMap;
	
	uniform sampler2D normalMap;
	uniform float _normalMapHeight;
	
	uniform float _dispersion;
	
	const float PI = 3.1415926;
	const float Deg2Rad = 0.01745329251;
	
	uniform float _slider;
	
	uniform vec2 _fog;
	
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
	vec4 raytracePlane(vec3 pos,vec3 dir,vec3 rot,vec2 size){
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
		
		return vec4(dis,InverseRotate(pos+dir*dis,rot));
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
						normal = lerp(vec3(0.,0.,1.)*sign(posTemp.z),normal,_normalMapHeight);
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
						normal = lerp(vec3(0.,0.,1.)*sign(posTemp.z),normal,_normalMapHeight);
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
						normal = lerp(vec3(0.,1.,0.)*sign(posTemp.y),normal,_normalMapHeight);
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
						normal = lerp(vec3(0.,1.,0.)*sign(posTemp.y),normal,_normalMapHeight);
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
						uv = endTemp.yz/size.yz+vec2(0.5);
						normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,0.,0.)));
						normal = lerp(vec3(1.,0.,0.)*sign(posTemp.x),normal,_normalMapHeight);
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
						uv = endTemp.yz/size.yz+vec2(0.5);
						normal = normalize(Rotate(texture2D(normalMap,uv).xyz-vec3(.5),vec3(0.,180.,0.)));
						normal = lerp(vec3(1.,0.,0.)*sign(posTemp.x),normal,_normalMapHeight);
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
	vec2 world2screen(vec3 wp){
		wp -= vec3(_camPos.xy,-_camPos.z);
		wp = InverseRotate(wp,vec3(-_camRot.x,-_camRot.y,_camRot.z)/Deg2Rad);


		wp/=wp.z;

		float realx = dot(wp,vec3(1.,0.,0.));
		float realy = dot(wp,vec3(0.,1.,0.));

		float height = tan(_fov*1.2*0.5*Deg2Rad)*2.;
		float width = height*_aspect;

		realx = realx/width+0.5;
		realy = realy/height+0.5;

		return vec2(realx,realy);
	}
	vec4 Cube(vec3 pos,vec3 dir,vec3 cubePos,vec3 cubeRot,vec3 cubeSize,int cubeIndex,float planeRot,inout bool hit){
	
		int face;
		vec2 uv;
		vec4 raycastCube = raytraceCube(pos-cubePos,dir,cubeRot,cubeSize,-1,face,uv);
		vec3 mypos=pos + raycastCube.x*dir;
		float dis = raycastCube.x;
		float alpha = 1.0;
		vec3 raytraceGround = raytraceGround(pos,dir,-1.25);
		if(raytraceGround.x<raycastCube.x){
			pos+=dir*raytraceGround.x;
			dir = reflect(dir,vec3(0,1,0));
			raycastCube = raytraceCube(pos-cubePos,dir,cubeRot,cubeSize,-1,face,uv);
			mypos= pos + raycastCube.x*dir;
			dis = (raytraceGround.x+raycastCube.x);
			alpha = (0.5-mypos.y/cubeSize.y)*0.4;
		}
		
		hit = raycastCube.x<999998.0;
		if(!hit)
			return vec4(0.);
		
		vec4 reflectColor = getSky(reflect(dir,raycastCube.yzw))*5.0;
		float refelectRatio = fractmount(dir,raycastCube.yzw,1.0/_eta);
	
		vec4 finalColor = vec4(0);
		for(int i=0;i!=3;i++){
			float index = float(i)/2.0;
			float myEta = _eta * (1.0+(index-0.5)*2.0*_dispersion);
			vec4 myColor = i==0?vec4(1.,0.,0.,1.):(i==1?vec4(0.,1.,0.,1.):vec4(0.,0.,1.,1.));
			
			vec3 mydir = dir;
			vec2 Myuv;
			int Myface;
	
			mydir = refrect(mydir,raycastCube.yzw,1.0/myEta);
			
			vec4 insideColor = vec4(0.);
			vec4 frontColor = vec4(0.);
			
			vec2 tuv;
			int tface;
			vec4 raytraceIcon = raytracePlane(mypos-cubePos,mydir,vec3(0,planeRot,0),vec2(min(cubeSize.x,cubeSize.z),min(cubeSize.x,cubeSize.z)*2.0));
			bool hitLogo = false;
			if(raytraceIcon.x<999998.0){
				vec4 logoPixel = texture2D(tDiffuse,world2screen(raytraceIcon.yzw+cubePos));
				frontColor = logoPixel;
			}
	
			vec4 myRaycastCube = raytraceCube(mypos-cubePos,mydir,cubeRot,cubeSize,face,Myface,Myuv);

			if(Myface==0)
				insideColor = texture2D(topMap,Myuv);
			else if(Myface==1)
				insideColor = texture2D(downMap,Myuv)*0.5;
			else{
				insideColor = texture2D(sideMap,Myuv)*0.5;
			}
	
			insideColor = AlphaBlend(frontColor,insideColor);
			finalColor += (reflectColor*(1.0-refelectRatio)+insideColor*(refelectRatio)) * myColor;
		}
		dis = 1.0-clamp((dis-_fog.x)/(_fog.y-_fog.x),0.,1.);
		finalColor = clamp(finalColor,vec4(0),vec4(1));
		return vec4(finalColor.xyz*dis*alpha,1.0);
	}
	void main()
	{
		vec3 camPos = vec3(_camPos.xy,-_camPos.z);
		vec3 camAng = vec3(-_camRot.x,-_camRot.y,_camRot.z)/Deg2Rad;
		
		vec2 mouse = _mouse.xy-vec2(.5);
			
		vec2 uv = -1. + 2. * vUv + _offset;

		vec3 dir = vec3(0.0,0.0,1.0);
		dir = Rotate(dir,vec3(-uv.y*_fov*0.5,uv.x*_fov*0.5*_aspect,0.));
		dir = Rotate(dir,camAng);
	
		bool hit;
		float mySlider = mod(_slider,2.0);

		int face = -1;
		vec2 te;

		for(int i=0;i!=5;i++){
			float pos = -float(i)+mySlider+1.0;
			vec3 mypos = vec3(1.5,0,-1.5)*pos;
			
			vec3 myrot = _cubeRot + vec3(0.,1.,0.)*pos*40.0;
			
			gl_FragColor = vec4(Cube(camPos,dir,mypos,myrot,_cubeSize,-1,-camAng.y,hit).xyz,1);
			if(hit)
				return;
		}

	}`

};

export { RefrectCube };