import * as THREE from '../three/build/three.module.js'
import { EffectComposer } from '../three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../three/examples/jsm/postprocessing/ShaderPass.js';
import { RefrectCube } from '../js/RefrectCube.js';
import { FXAAShader } from '../three/examples/jsm/shaders/FXAAShader.js';
import { FBXLoader } from '../three/examples/jsm/loaders/FBXLoader.js';
import { RectAreaLightUniformsLib } from '../three/examples/jsm/lights/RectAreaLightUniformsLib.js';

const Deg2Rad = 0.01745329251;
const PI = 3.1415926;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45 * 1.2, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'ZYX';
var cam_pos = new THREE.Vector3(0, 0, 4.5);
camera.position.set(cam_pos.x, cam_pos.y, cam_pos.z);

var orb_center = new THREE.Object3D();
orb_center.rotation.order = 'ZYX';
scene.add(orb_center);
orb_center.add(camera);


var renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor("#000000",0);
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);
//const controls = new OrbitControls(camera, renderer.domElement);

RectAreaLightUniformsLib.init();
const url = ["../model/LAB.fbx", "../model/FACTORY.fbx", "../model/CREATIVE.fbx", "../model/TOUR.fbx"];
var icons = [];
var cubes = [];
for (let i = 0; i != 7; i++) {
    let loader = new FBXLoader();
    loader.load(
        url[i % 4],
        function (loadedModel) {
            loadedModel.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    const matKnot = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0, metalness: 0 });
                    child.material = matKnot;
                    icons[i] = child;
                }
            });
            icons[i].scale.set(0.07, 0.07, 0.07);
            scene.add(icons[i]);
        }
    );

    cubes[i] = new THREE.Object3D();
    scene.add(cubes[i]);

    let light = new THREE.RectAreaLight(0xFFFFFF, 1.5, 1, 2.5);
    light.position.set(0, 0, -0.5);
    light.lookAt(0, 0, 0);
    cubes[i].add(light);
}



const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const refrectCubePass = new ShaderPass(RefrectCube);
refrectCubePass.uniforms['_aspect'].value = camera.aspect;
refrectCubePass.uniforms['bg'].value = new THREE.TextureLoader().load("image/bg.png");
refrectCubePass.uniforms['topMap'].value = new THREE.TextureLoader().load("image/topMap.png");
refrectCubePass.uniforms['sideMap'].value = new THREE.TextureLoader().load("image/sideMap.png");
refrectCubePass.uniforms['downMap'].value = new THREE.TextureLoader().load("image/downMap.png");
refrectCubePass.uniforms['normalMap'].value = new THREE.TextureLoader().load("image/normalMap.png");
refrectCubePass.uniforms['_offset'].value = camera.aspect > 1 ? new THREE.Vector2(-0.4, 0.0) : new THREE.Vector2(0.0, 0.0);
composer.addPass(refrectCubePass);

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.3, 0.7, 0. );
composer.addPass( bloomPass );

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * window.devicePixelRatio);
fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * window.devicePixelRatio);
composer.addPass(fxaaPass);









var LightPos = [0, 0];
var TargetPos = [0, 0];

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

function mod(i, m) {
    if (i > 0)
        return i % m;
    return i % m + m;
}
function update(delta) {
    LightPos[0] = (TargetPos[0] - LightPos[0]) * delta / 500.0 + LightPos[0];
    LightPos[1] = (TargetPos[1] - LightPos[1]) * delta / 500.0 + LightPos[1];
    mySlider = (Math.floor(Slider) - mySlider) * delta / 500.0 + mySlider;

    refrectCubePass.uniforms['_slider'].value = mySlider;
    refrectCubePass.uniforms['_mouse'].value = new THREE.Vector2(LightPos[0], LightPos[1]);

    var _camWorldPos = new THREE.Vector3(0, 0, 0);
    camera.getWorldPosition(_camWorldPos);
    var _camWorldQut = new THREE.Quaternion();
    camera.getWorldQuaternion(_camWorldQut);
    var _camWorldRot = new THREE.Euler().setFromQuaternion(_camWorldQut, 'ZYX');

    refrectCubePass.uniforms['_camPos'].value = new THREE.Vector3(_camWorldPos.x, _camWorldPos.y, _camWorldPos.z);
    refrectCubePass.uniforms['_camRot'].value = new THREE.Vector3(_camWorldRot.x, _camWorldRot.y, _camWorldRot.z);


    orb_center.rotation.set(LightPos[1] * 20 * Deg2Rad, LightPos[0] * 20 * Deg2Rad, 0);



    for (let i = 0; i != 7; i++) {
        let pos = -i + mod(mySlider, 4) + 1.0;

        cubes[i].position.set(1.5 * pos, 0, 1.5 * pos);
        cubes[i].rotation.set(0, pos * 40.0 * Deg2Rad, 0);

        if (icons[i]) {
            icons[i].position.set(1.5 * pos, 0, 1.5 * pos);
            icons[i].rotation.set(0, pos * 40.0 * Deg2Rad, 0);
        }
    }


    composer.render();
}


window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    refrectCubePass.uniforms['_aspect'].value = camera.aspect;
    refrectCubePass.uniforms['_offset'].value = camera.aspect > 1 ? new THREE.Vector2(-0.4, 0.0) : new THREE.Vector2(0.0, 0.0);

    bloomPass.resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );

    fxaaPass.uniforms['resolution'].value.x = 1 / (window.innerWidth * window.devicePixelRatio);
    fxaaPass.uniforms['resolution'].value.y = 1 / (window.innerHeight * window.devicePixelRatio);

    camera.updateProjectionMatrix();
})


document.onmousemove = function (e) {
    var MousePos = [e.pageX / window.innerWidth - 0.5, e.pageY / window.innerHeight - 0.5];
    TargetPos = MousePos;
}
window.onmousewheel = function (e) {
    Slider += e.wheelDelta * 0.005;
}