import {
    Vector2,
    Vector3,
    Vector4,
    Color
} from '../three/build/three.module.js';

const shapeShader = {

    uniforms: {
        '_alpha': { type: 't', value: null },
        '_frontColor': { type: 'c', value: new Color(0x000000) },
        '_backColor': { type: 'c', value: new Color(0x000000) },
        '_frontMap': { type: 't', value: null },
        '_backMap': { type: 't', value: null },
        '_shapeMask': { type: 't', value: null },
        '_shapeIndex': { type: 'i', value: 0 },
    },

    vertexShader: /* glsl */`
    #define PHONG

    in vec2 uv2;

    #include <morphtarget_pars_vertex>
    #include <normal_pars_vertex>

    varying vec2 vUv;
    varying vec2 vUv2;
    varying vec3 vPosition;

    void main() {
        vUv = uv;

        vUv = (vUv-0.5)*0.99;
        vUv = vUv+0.5;
        vUv = vec2(1.0-vUv.x,vUv.y);

        vUv2 = uv2;

        
        #include <beginnormal_vertex>
	    #include <morphnormal_vertex>
	    #include <defaultnormal_vertex>
	    #include <normal_vertex>
        
        #include <begin_vertex>
	    #include <morphtarget_vertex>
        
        vPosition = (modelMatrix * vec4( transformed, 1.0 )).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
    }
    `,

    fragmentShader: /* glsl */`
        const float PI = 3.1415926;
        const float Deg2Rad = 0.01745329251;

        precision highp float;

        varying vec2 vUv;
        varying vec2 vUv2;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        uniform sampler2D _alpha;
        uniform sampler2D _frontMap;
        uniform sampler2D _backMap;
        uniform sampler2D _shapeMask;
        uniform int _shapeIndex;

        vec2 gradientNoise_dir(vec2 p)
        {
            p = mod(p , 289.0);
            float x = (34.0 * p.x + 1.0) * mod(p.x , 289.0) + p.y;
            x = (34.0 * x + 1.0) * mod(x , 289.0);
            x = fract(x / 41.0) * 2.0 - 1.0;
            return normalize(vec2(x - floor(x + 0.5), abs(x) - 0.5));
        }

        float gradientNoise(vec2 p)
        {
            vec2 ip = floor(p);
            vec2 fp = fract(p);
            float d00 = dot(gradientNoise_dir(ip), fp);
            float d01 = dot(gradientNoise_dir(ip + vec2(0, 1)), fp - vec2(0, 1));
            float d10 = dot(gradientNoise_dir(ip + vec2(1, 0)), fp - vec2(1, 0));
            float d11 = dot(gradientNoise_dir(ip + vec2(1, 1)), fp - vec2(1, 1));
            fp = fp * fp * fp * (fp * (fp * 6.0 - 15.0) + 10.0);
            return mix(mix(d00, d01, fp.y), mix(d10, d11, fp.y), fp.x);
        }

        float GradientNoise_float(vec2 UV, float Scale)
        {
            return gradientNoise(UV * Scale) + 0.5;
        }

        vec2 Noise(vec2 UV,float Size){
            vec2 UV1 = vec2(UV.x*0.5+0.5,UV.y*0.5+0.5);
            vec2 UV2 = vec2(UV.x*0.5,UV.y*0.5);
            float Noise1 = GradientNoise_float(UV1, Size);
            float Noise2 = GradientNoise_float(UV2, Size);
            return vec2(Noise1*2.0-1.0,Noise2*2.0-1.0);
        }
        void main()
        {
            vec4 maskMap = texture(_shapeMask,vUv2);
            float mask = _shapeIndex==0?maskMap.r:(_shapeIndex==1?maskMap.g:maskMap.b);
            
            vec2 alphaUV = vUv+Noise(vUv2,15.0)*0.01*mask;

            if(texture(_alpha,alphaUV).r<0.5)
                discard;
            
            vec4 color = vec4(0);
            if(gl_FrontFacing){
                float d = dot(vec3(0,0,1),vNormal);
                d = mix(0.5,1.0,d);
                color = texture(_frontMap,vUv2)*d;
            }else{
                float d = dot(vec3(0,0,1),-vNormal);
                d = mix(0.5,1.0,d);
                color = texture(_backMap,vUv2)*d;
            }
            gl_FragColor = vec4(color.xyz,1);
        }`

};

export { shapeShader };