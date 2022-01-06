
perlin.seed();
function perlin_noise(x, y, seed, scale) {
	return perlin.get((x/scale)+(1000*seed), y/scale);
}

export function get_value(x, y) {
	return perlin_noise(x, y, 0, 10);
}



