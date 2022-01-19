import * as THREE from '../three/build/three.module.js';
class shapeParameters {
    shapes = [
        {
            edg_A: [0, -5, 2.679492, 5],
            edg_B: [0, -5, -2.679492, 5],
            minHeight: 0.2928203,
            pointList: [
                new THREE.Vector2(0, -5),
                new THREE.Vector2(2.679492, 5),
                new THREE.Vector2(0, 3.452995),
                new THREE.Vector2(-2.679492, 5)
            ],
            shapeScale: 1464.102,
            initCut: [-3, 2.320508, 3, 2.320508]
        }, {
            edg_A: [0, -5, 2.928932, 2.071068],
            edg_B: [0, -5, -4.142136, 5],
            minHeight: 0.2828427,
            pointList: [
                new THREE.Vector2(0, -5),
                new THREE.Vector2(2.928932, 2.071068),
                new THREE.Vector2(-4.142136, 5)
            ],
            shapeScale: 1530.734,
            initCut: [-3.5, 2.071068, 3.5, 2.071068]
        }, {
            edg_A: [0, -5, 3.09017, 4.510565],
            edg_B: [0, -5, -3.09017, 4.510565],
            minHeight: 0.2723525,
            pointList: [
                new THREE.Vector2(0, -5),
                new THREE.Vector2(3.09017, 4.510565),
                new THREE.Vector2(1.367287, 3.632713),
                new THREE.Vector2(0, 5),
                new THREE.Vector2(-1.367287, 3.632713),
                new THREE.Vector2(-3.09017, 4.510565)
            ],
            shapeScale: 1414.214,
            initCut: [-3, 1.808813, 3, 1.808813]
        }
    ];
}
export { shapeParameters };
