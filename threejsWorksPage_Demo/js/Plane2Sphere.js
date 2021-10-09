import {
	Vector2,
} from '../three/build/three.module.js';

const Plane2Sphere = {

	uniforms: {

		'tDiffuse': { value: null },
		'_aspect': { type: 'f',value: 1.0},
		'_fov': { type: 'f',value: 45.0 },
		'_offset': { type: 'v2',value: new Vector2( 0.0, 0.0 ) },
		
	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

	precision highp float;

	uniform sampler2D tDiffuse;

	varying vec2 vUv;
	
	uniform float _aspect;
	uniform float _fov;
	uniform vec2 _offset;

	const float PI = 3.1415926;
	const float Deg2Rad = 0.01745329251;

	void main() {
		vec2 uv = (vUv-0.5) + _offset*0.5;
		float x = uv.x*_fov*Deg2Rad*_aspect;
		float y = uv.y*_fov*Deg2Rad;
		vec3 realpos = vec3(sin(x)*cos(y),sin(y),cos(x)*cos(y));

		realpos/=realpos.z;

		float realx = dot(realpos,vec3(1.,0.,0.));
		float realy = dot(realpos,vec3(0.,1.,0.));

		float height = tan(_fov*0.5*Deg2Rad)*2.;
		float width = height*_aspect;

		realx = realx/width+0.5;
		realy = realy/height+0.5;

		gl_FragColor = texture2D(tDiffuse,vec2(realx,realy));
		if(realx<0.||realx>1.||realy<0.||realy>1.)
			gl_FragColor = vec4(0,0,0,1);
	}
	`

};

export { Plane2Sphere };