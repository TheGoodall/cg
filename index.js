import * as THREE from './node_modules/three/src/Three.js';

import * as TILES from './city_tiles.js';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


camera.position.z = 5;



for (let i = 0; i < 15; i++) {
	let line = "";
	for (let j = 0; j < 15; j++) {
		line += TILES.get_value(i, j);
		line += ", "
	}
	console.log(line);
}

scene.fog = new THREE.FogExp2( 0xaaccff, 0.0007 );

let geometry = new THREE.PlaneGeometry( 20000, 20000, 128, 128 );
const position = geometry.attributes.position;
position.usage = THREE.DynamicDrawUsage;
for ( let i = 0; i < position.count; i ++ ) {
	const y = 35* Math.sin( i/2 );
	position.setY(i, y)
}


let material = new THREE.MeshStandardMaterial( { color: 0x0044ff } );

let mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

function animate() {
	requestAnimationFrame( animate );
	
	renderer.render( scene, camera );

}
animate();
