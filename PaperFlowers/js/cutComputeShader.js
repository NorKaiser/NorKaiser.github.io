import * as THREE from '../three/build/three.module.js';


class cutComputeShader {
    ComputeShader = {
        uniforms: {
            '_pointList': { type: 't', value: null },
            '_pointLength': { type: 'i', value: 0 },
            '_rect': { type: 'fv', value: [-5.0, 0.0, -5.0, 0.0] },
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
        uniform sampler2D _pointList;
        uniform int _pointLength;
        uniform vec4 _rect;

        void main()
        {
            float x = vUv.x;
            float y = vUv.y;
            vec2 pos = vec2(x-0.5,y-0.5)*10.0;
            if(pos.x<_rect[0] || pos.x>_rect[2] || pos.y<_rect[1] || pos.y>_rect[3]){
                gl_FragColor = vec4(0,0,0,1.0);
                return;
            }
            float angle = 0.0;
            for(int i=0;i<_pointLength;i++){
                vec2 pre = texelFetch(_pointList,ivec2(i,0),0).xy-pos;
                vec2 next = texelFetch(_pointList,ivec2((i+1>=_pointLength)?0:(i+1),0),0).xy-pos;
                float preAngle = atan(pre.y,pre.x);
                float nextAngle = atan(next.y,next.x);
                float temp = nextAngle-preAngle;
                if(pre.y*next.y<0.0 &&(next.y*(pre.x-next.x)/(next.y-pre.y)+next.x<0.0)){
                    temp -= 2.0*3.1415926*(temp/abs(temp));
                }
                angle+=temp;
            }
            float result = abs(abs(angle/(2.0*3.1415926))-1.0)<0.001?1.0:0.0;
            gl_FragColor = vec4(result,result,result,result);
        }`
    };
    constructor(renderer) {
        const scene = new THREE.Scene();
        const camera = new THREE.Camera();
        camera.position.z = 1;
        const material = new THREE.ShaderMaterial({
            uniforms: this.ComputeShader.uniforms,
            vertexShader: this.ComputeShader.vertexShader,
            fragmentShader: this.ComputeShader.fragmentShader
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(mesh);
        this.getResult = function (pointList, rect, renderTarget) {

            const currentRenderTarget = renderer.getRenderTarget();
            const data = new Float32Array(pointList.length * 4);
            const pointListTex = new THREE.DataTexture(data, pointList.length, 1, THREE.RGBAFormat, THREE.FloatType);
            for (let i = 0; i != pointList.length; i++) {
                pointListTex.image.data[i * 4 + 0] = pointList[i].x;
                pointListTex.image.data[i * 4 + 1] = pointList[i].y;
                pointListTex.image.data[i * 4 + 2] = 0;
                pointListTex.image.data[i * 4 + 3] = 1;
            }
            material.uniforms['_pointList'].value = pointListTex;
            material.uniforms['_pointLength'].value = pointList.length;
            material.uniforms['_rect'].value = [rect.x_min, rect.y_min, rect.x_max, rect.y_max];
            renderer.setRenderTarget(renderTarget);
            renderer.clear();
            renderer.render(scene, camera);
            renderer.setRenderTarget(currentRenderTarget);
            return renderTarget.texture;
        };

    }
}

export { cutComputeShader };
