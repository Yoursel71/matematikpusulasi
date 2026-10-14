// MOLEKÜL — 3D molekül verileri ve Three.js yardımcıları.
// Koordinatlar ångström (Å) cinsindendir; bağ uzunlukları ve açıları gerçek değerlere yakındır.
import * as THREE from '../vendor/three.module.min.js';

// CPK renkleri (dergideki model renkleriyle aynı). ball: top-çubuk yarıçapı, vdw: van der Waals yarıçapı (Å).
export const ELEMENTS = {
    H: { color: 0xf2f2f2, ball: 0.26, vdw: 1.2, ink: '#0b2433' },
    C: { color: 0x3b4148, ball: 0.4, vdw: 1.7, ink: '#ffffff' },
    N: { color: 0x2f6bff, ball: 0.38, vdw: 1.55, ink: '#ffffff' },
    O: { color: 0xe4572e, ball: 0.38, vdw: 1.52, ink: '#ffffff' },
};

// Dolgu modelinde atomlar biraz küçültülür; aksi hâlde molekülün şekli tek bir kütle gibi görünür.
const SPACE_SCALE = 0.8;

// Metandaki C–H bağı (1,09 Å) dörtyüzlü köşelere yönelir: (±1, ±1, ±1) / √3.
export const TETRA = 1.09 / Math.sqrt(3);

// atoms: [element, x, y, z]; links: [atom1, atom2, bağ derecesi]; lonePairs: [atom, yön x, y, z]
export const MOLECULES = {
    h2o: {
        name: 'Su',
        formula: 'H<sub>2</sub>O',
        shape: 'Açısal (bükük)',
        angle: '104,5°',
        polarity: 'Polar',
        bondText: '2 tek bağ (O–H); oksijende 2 ortaklanmamış elektron çifti',
        note: 'Kutuplu olduğu için tuz ve şeker gibi maddeleri iyi çözer.',
        page: 6,
        atoms: [['O', 0, 0, 0], ['H', -0.759, -0.587, 0], ['H', 0.759, -0.587, 0]],
        links: [[0, 1, 1], [0, 2, 1]],
        lonePairs: [[0, 0, 0.545, 0.839], [0, 0, 0.545, -0.839]],
    },
    ch4: {
        name: 'Metan',
        formula: 'CH<sub>4</sub>',
        shape: 'Dörtyüzlü',
        angle: '109,5°',
        polarity: 'Apolar',
        bondText: '4 tek bağ (C–H)',
        note: 'Doğal gazın ana bileşenidir; yandığında CO<sub>2</sub> ve H<sub>2</sub>O oluşur.',
        page: 5,
        atoms: [
            ['C', 0, 0, 0],
            ['H', TETRA, TETRA, TETRA],
            ['H', TETRA, -TETRA, -TETRA],
            ['H', -TETRA, TETRA, -TETRA],
            ['H', -TETRA, -TETRA, TETRA],
        ],
        links: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]],
    },
    co2: {
        name: 'Karbondioksit',
        formula: 'CO<sub>2</sub>',
        shape: 'Doğrusal',
        angle: '180°',
        polarity: 'Apolar',
        bondText: '2 çift bağ (C=O)',
        note: 'Yanma ve solunumun ürünüdür; bitkiler fotosentezde kullanır.',
        page: 5,
        atoms: [['O', -1.16, 0, 0], ['C', 0, 0, 0], ['O', 1.16, 0, 0]],
        links: [[1, 0, 2], [1, 2, 2]],
    },
    nh3: {
        name: 'Amonyak',
        formula: 'NH<sub>3</sub>',
        shape: 'Üçgen piramit',
        angle: '107°',
        polarity: 'Polar',
        bondText: '3 tek bağ (N–H); azotta 1 ortaklanmamış elektron çifti',
        note: 'Gübre üretiminde kullanılır. Ortaklanmamış çift, molekülü piramit şekline getirir.',
        page: 6,
        atoms: [
            ['N', 0, 0, 0],
            ['H', 0.937, -0.376, 0],
            ['H', -0.4685, -0.376, 0.8115],
            ['H', -0.4685, -0.376, -0.8115],
        ],
        links: [[0, 1, 1], [0, 2, 1], [0, 3, 1]],
        lonePairs: [[0, 0, 1, 0]],
    },
    o2: {
        name: 'Oksijen',
        formula: 'O<sub>2</sub>',
        shape: 'Doğrusal',
        angle: '—',
        polarity: 'Apolar',
        bondText: '1 çift bağ (O=O)',
        note: 'Kuru havanın yaklaşık %21’idir; yanma için gereklidir.',
        page: 7,
        atoms: [['O', -0.605, 0, 0], ['O', 0.605, 0, 0]],
        links: [[0, 1, 2]],
    },
    n2: {
        name: 'Azot',
        formula: 'N<sub>2</sub>',
        shape: 'Doğrusal',
        angle: '—',
        polarity: 'Apolar',
        bondText: '1 üçlü bağ (N≡N)',
        note: 'Havanın yaklaşık %78’idir. Üçlü bağ çok sağlam olduğu için zor tepkime verir.',
        page: 4,
        atoms: [['N', -0.55, 0, 0], ['N', 0.55, 0, 0]],
        links: [[0, 1, 3]],
    },
    h2: {
        name: 'Hidrojen',
        formula: 'H<sub>2</sub>',
        shape: 'Doğrusal',
        angle: '—',
        polarity: 'Apolar',
        bondText: '1 tek bağ (H–H)',
        note: 'En basit molekül: iki atom tek bir ortak elektron çiftini paylaşır.',
        page: 4,
        atoms: [['H', -0.37, 0, 0], ['H', 0.37, 0, 0]],
        links: [[0, 1, 1]],
    },
};

export const ORDER = ['h2o', 'ch4', 'co2', 'nh3', 'o2', 'n2', 'h2'];

// ---------- Ortak geometri ve malzemeler ----------
const UP = new THREE.Vector3(0, 1, 0);
export const sphereGeometry = new THREE.SphereGeometry(1, 32, 24);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 20, 1);

const atomMaterials = {};
export function atomMaterial(symbol) {
    if (!atomMaterials[symbol]) {
        atomMaterials[symbol] = new THREE.MeshStandardMaterial({
            color: ELEMENTS[symbol].color,
            roughness: 0.35,
            metalness: 0.05,
        });
    }
    return atomMaterials[symbol];
}

export const BOND_COLOR = 0xa7b4ba;
const bondMaterial = new THREE.MeshStandardMaterial({ color: BOND_COLOR, roughness: 0.45, metalness: 0.05 });
const lobeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2ec4b6,
    transparent: true,
    opacity: 0.3,
    roughness: 0.6,
    depthWrite: false,
});

const BOND_RADIUS = { 1: 0.085, 2: 0.06, 3: 0.05 };
const BOND_GAP = { 1: 0, 2: 0.17, 3: 0.16 };
const BOND_SHIFTS = { 1: [0], 2: [-0.5, 0.5], 3: [-1, 0, 1] };

const _dir = new THREE.Vector3();
const _ref = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

function placeCylinder(mesh, a, b, radius) {
    _dir.subVectors(b, a);
    const len = _dir.length();
    mesh.position.copy(a).addScaledVector(_dir, 0.5);
    mesh.scale.set(radius, Math.max(len, 1e-4), radius);
    if (len > 1e-6) mesh.quaternion.setFromUnitVectors(UP, _dir.multiplyScalar(1 / len));
}

// Bağ derecesi kadar silindir içeren bir grup; çift ve üçlü bağlar yan yana çizilir.
export function createBond(order, material = bondMaterial) {
    const bond = new THREE.Group();
    bond.userData.order = order;
    for (let k = 0; k < order; k++) bond.add(new THREE.Mesh(cylinderGeometry, material));
    return bond;
}

export function updateBond(bond, a, b) {
    const order = bond.userData.order;
    _dir.subVectors(b, a).normalize();
    _ref.set(0, 0, 1);
    if (Math.abs(_dir.dot(_ref)) > 0.9) _ref.set(0, 1, 0);
    _perp.crossVectors(_dir, _ref).normalize();
    BOND_SHIFTS[order].forEach((shift, k) => {
        _a.copy(a).addScaledVector(_perp, shift * BOND_GAP[order]);
        _b.copy(b).addScaledVector(_perp, shift * BOND_GAP[order]);
        placeCylinder(bond.children[k], _a, _b, BOND_RADIUS[order]);
    });
}

// ---------- Atom etiketleri (her zaman kameraya bakan yazı) ----------
// onTop: true ise etiket her şeyin üstünde çizilir; false ise önündeki atomlar etiketi örter.
const labelTextures = {};
const labelMaterials = {};
function labelMaterial(symbol, onTop) {
    const key = `${symbol}:${onTop}`;
    if (!labelMaterials[key]) {
        labelMaterials[key] = new THREE.SpriteMaterial({
            map: labelTexture(symbol),
            depthTest: !onTop,
            depthWrite: false,
            transparent: true,
        });
    }
    return labelMaterials[key];
}

function labelTexture(symbol) {
    if (labelTextures[symbol]) return labelTextures[symbol];
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '800 76px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = symbol === 'H' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(11, 36, 51, 0.85)';
    ctx.strokeText(symbol, 64, 68);
    ctx.fillStyle = ELEMENTS[symbol].ink;
    ctx.fillText(symbol, 64, 68);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    labelTextures[symbol] = texture;
    return texture;
}

export function createLabel(symbol, size = 0.42, onTop = true) {
    const sprite = new THREE.Sprite(labelMaterial(symbol, onTop));
    sprite.scale.set(size, size, 1);
    sprite.renderOrder = onTop ? 10 : 0;
    return sprite;
}

// Etiketleri her karede atomun kameraya bakan yüzeyine taşır; böylece arkadaki atomların etiketi görünmez.
const _camLocal = new THREE.Vector3();
const _toCam = new THREE.Vector3();
export function faceLabels(group, camera) {
    const labels = group.userData.labels;
    if (!labels || !labels.length) return;
    group.updateWorldMatrix(true, false);
    _camLocal.copy(camera.position);
    group.worldToLocal(_camLocal);
    labels.forEach(({ sprite, base, r }) => {
        _toCam.subVectors(_camLocal, base).normalize();
        sprite.position.copy(base).addScaledVector(_toCam, r * 1.02);
    });
}

// ---------- Molekül modeli ----------
// mode: 'ball' (top-çubuk) ya da 'space' (dolgu). Model, ağırlık merkezi orijinde olacak şekilde ortalanır.
export function buildMolecule(data, { mode = 'ball', labels = false, lonePairs = false } = {}) {
    const group = new THREE.Group();
    const points = data.atoms.map(([, x, y, z]) => new THREE.Vector3(x, y, z));
    const center = new THREE.Vector3();
    points.forEach((p) => center.add(p));
    center.divideScalar(points.length);
    points.forEach((p) => p.sub(center));

    const radiusOf = (symbol) => (mode === 'space' ? ELEMENTS[symbol].vdw * SPACE_SCALE : ELEMENTS[symbol].ball);
    let extent = 0;
    group.userData.labels = [];

    data.atoms.forEach(([symbol], i) => {
        const r = radiusOf(symbol);
        const mesh = new THREE.Mesh(sphereGeometry, atomMaterial(symbol));
        mesh.scale.setScalar(r);
        mesh.position.copy(points[i]);
        group.add(mesh);
        if (labels) {
            const label = createLabel(symbol, mode === 'space' ? 0.55 : 0.42, false);
            label.position.copy(points[i]);
            group.add(label);
            group.userData.labels.push({ sprite: label, base: points[i].clone(), r });
        }
        extent = Math.max(extent, points[i].length() + r);
    });

    if (mode === 'ball') {
        data.links.forEach(([i, j, order]) => {
            const bond = createBond(order);
            updateBond(bond, points[i], points[j]);
            group.add(bond);
        });
    }

    if (lonePairs && data.lonePairs) {
        data.lonePairs.forEach(([i, x, y, z]) => {
            const dir = new THREE.Vector3(x, y, z).normalize();
            const lobe = new THREE.Mesh(sphereGeometry, lobeMaterial);
            lobe.scale.set(0.2, 0.36, 0.2);
            lobe.quaternion.setFromUnitVectors(UP, dir);
            lobe.position.copy(points[i]).addScaledVector(dir, radiusOf(data.atoms[i][0]) + 0.28);
            group.add(lobe);
            extent = Math.max(extent, lobe.position.length() + 0.36);
        });
    }

    group.userData.radius = Math.max(extent, 0.8);
    return group;
}

// ---------- Sahne, kamera, etkileşim ----------
export function createViewer(host, { fov = 40, onResize } = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4a55, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(4, 6, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fe7d4, 0.9);
    rim.position.set(-6, -3, -5);
    scene.add(rim);

    const resize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (onResize) onResize();
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize);
    resize();

    return { renderer, scene, camera };
}

// Verilen yarıçaptaki modelin ekrana sığması için kamera uzaklığı.
export function fitDistance(camera, radius, margin = 1.3) {
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    let distance = (radius * margin) / Math.sin(half);
    if (camera.aspect < 1) distance /= camera.aspect;
    return distance;
}

// Sürükleyerek (fare / dokunma) ve ok tuşlarıyla döndürme.
export function attachDragRotate(el, target) {
    const state = { dragging: false };
    let lastX = 0;
    let lastY = 0;
    const clampX = (x) => THREE.MathUtils.clamp(x, -1.3, 1.3);

    el.addEventListener('pointerdown', (e) => {
        state.dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* bazı tarayıcılar desteklemez */ }
    });
    el.addEventListener('pointermove', (e) => {
        if (!state.dragging) return;
        target.rotation.y += (e.clientX - lastX) * 0.01;
        target.rotation.x = clampX(target.rotation.x + (e.clientY - lastY) * 0.01);
        lastX = e.clientX;
        lastY = e.clientY;
    });
    const stop = () => { state.dragging = false; };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('lostpointercapture', stop);

    el.addEventListener('keydown', (e) => {
        const step = 0.15;
        if (e.key === 'ArrowLeft') target.rotation.y -= step;
        else if (e.key === 'ArrowRight') target.rotation.y += step;
        else if (e.key === 'ArrowUp') target.rotation.x = clampX(target.rotation.x - step);
        else if (e.key === 'ArrowDown') target.rotation.x = clampX(target.rotation.x + step);
        else return;
        e.preventDefault();
    });
    return state;
}

// Sahne yalnızca ekranda görünürken çizilir (pil ve işlemci tasarrufu).
export function runWhenVisible(el, frame) {
    let visible = false;
    let raf = 0;
    let last = 0;
    const tick = (now) => {
        raf = 0;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        frame(dt, now / 1000);
        if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const start = () => {
        if (raf || !visible || document.hidden) return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            visible = entries[0].isIntersecting;
            start();
        }, { rootMargin: '100px' }).observe(el);
    } else {
        visible = true;
        start();
    }
    document.addEventListener('visibilitychange', start);
}
