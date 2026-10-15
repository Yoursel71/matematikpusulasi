// MOLEKÜL web sitesi — 3D sahneler: kahraman bölümü, molekül laboratuvarı ve tepkime animasyonu.
import * as THREE from '../vendor/three.module.min.js';
import {
    ELEMENTS,
    MOLECULES,
    TETRA,
    BOND_COLOR,
    sphereGeometry,
    atomMaterial,
    buildMolecule,
    deformMolecule,
    createBond,
    updateBond,
    createLabel,
    faceLabels,
    createViewer,
    fitDistance,
    attachDragRotate,
    runWhenVisible,
} from './molekuller.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const compact = window.matchMedia('(max-width: 799px)').matches;

function hasWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (err) {
        return false;
    }
}

function lazyScene(id, init) {
    const host = $(id);
    if (!host) return;
    const start = () => {
        try { init(); }
        catch (err) {
            console.error(err);
            host.closest('.stage')?.classList.add('viewer-unavailable');
            if (id === 'hero-3d') host.parentElement.classList.remove('is-3d');
        }
    };
    if (id === 'hero-3d' || !('IntersectionObserver' in window)) return start();
    const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        start();
    }, { rootMargin: '300px' });
    observer.observe(host);
}

function viewerControls(host, pivot, viewer, reset) {
    const stage = host.closest('.stage');
    const zoom = (factor) => {
        const length = THREE.MathUtils.clamp(viewer.camera.position.length() * factor, 2.5, 90);
        viewer.camera.position.setLength(length);
    };
    stage.querySelectorAll('[data-zoom]').forEach((button) => {
        button.addEventListener('click', () => zoom(button.dataset.zoom === 'in' ? 0.84 : 1.19));
    });
    stage.querySelector('[data-reset-view]')?.addEventListener('click', () => {
        pivot.rotation.set(0.35, -0.5, 0);
        reset();
    });
    host.addEventListener('wheel', (event) => {
        if (!stage.classList.contains('is-expanded')) return;
        event.preventDefault();
        zoom(event.deltaY > 0 ? 1.07 : 0.93);
    }, { passive: false });
    host.addEventListener('keydown', (event) => {
        if (event.key === '+' || event.key === '=') { zoom(0.84); event.preventDefault(); }
        if (event.key === '-') { zoom(1.19); event.preventDefault(); }
    });
    return attachDragRotate(host, pivot, { onZoom: zoom });
}

function seeded(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ============================================
// 1. Kahraman bölümü: süzülen molekül bulutu
// ============================================
function initHero() {
    const host = $('hero-3d');
    if (!host) return;
    const { renderer, scene, camera } = createViewer(host, { fov: 45 });
    scene.fog = new THREE.Fog(0x0b2433, 12, 30);
    camera.position.set(0, 0, 14);

    const random = seeded(11);
    const keys = compact ? ['h2o', 'ch4', 'nh3', 'co2', 'o2', 'h2o'] : ['h2o', 'ch4', 'nh3', 'co2', 'o2', 'h2o', 'ch4', 'n2', 'co2', 'h2o'];
    const items = keys.map((key, index) => {
        const group = buildMolecule(MOLECULES[key]);
        group.scale.setScalar(compact ? 0.75 + random() * 0.4 : 1.1 + random() * 0.7);
        // Moleküller çoğunlukla sağ tarafta: sol taraf başlık metnine ayrılır.
        group.position.set((random() - 0.5) * (compact ? 10 : 13), (random() - 0.5) * 7, -4 + random() * 6);
        if (index === 0) { group.position.set(0, 0, 2); group.scale.setScalar(compact ? 3.0 : 1.7); }
        if (compact && index > 0) {
            const positions = [[-4.2, 1.3, -2], [3.8, 2.2, -4], [4.1, -1.7, -2], [-4.3, -2, -4], [-0.3, 3, -7]];
            group.position.fromArray(positions[index - 1]);
        }
        group.rotation.set(random() * 6, random() * 6, 0);
        scene.add(group);
        return {
            group,
            baseY: group.position.y,
            phase: random() * Math.PI * 2,
            spinX: (random() - 0.5) * 0.5,
            spinY: 0.15 + random() * 0.35,
        };
    });

    host.parentElement.classList.add('is-3d');

    const pointer = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
        pointer.x = e.clientX / window.innerWidth - 0.5;
        pointer.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    runWhenVisible(host, (dt, t) => {
        if (!reduceMotion) {
            items.forEach((it) => {
                it.group.rotation.x += it.spinX * dt;
                it.group.rotation.y += it.spinY * dt;
                it.group.position.y = it.baseY + Math.sin(t * 0.6 + it.phase) * 0.35;
            });
            camera.position.x += (pointer.x * 2 - camera.position.x) * 0.04;
            camera.position.y += (-pointer.y * 1.4 - camera.position.y) * 0.04;
        }
        camera.lookAt(0, 0, -2);
        renderer.render(scene, camera);
    });
}

// ============================================
// 2. 3D molekül laboratuvarı
// ============================================
const setText = (id, value, html = false) => {
    const el = $(id);
    if (!el) return;
    if (html) el.innerHTML = value;
    else el.textContent = value;
};

function renderMoleculeInfo(key, host) {
    const m = MOLECULES[key];
    setText('mol-name', m.name);
    setText('lab-stage-name', `${m.name} · ${m.formula.replace(/<[^>]+>/g, '')}`);
    setText('mol-formula', m.formula, true);
    setText('mol-shape', m.shape);
    setText('mol-angle', m.angle);
    setText('mol-polar', m.polarity);
    setText('mol-bonds', m.bondText);
    setText('mol-note', m.note, true);
    const polar = $('mol-polar');
    if (polar) polar.dataset.kind = m.polarity === 'Polar' ? 'polar' : 'apolar';
    const link = $('mol-page');
    if (link) {
        link.href = `sayfa${m.page}.html`;
        link.textContent = `Dergide oku: sayfa ${m.page} →`;
    }
    host.setAttribute('aria-label', `${m.name} molekülünün döndürülebilir 3 boyutlu modeli`);
}

function initLab() {
    const host = $('lab-3d');
    if (!host) return;

    const state = { key: 'h2o', mode: 'ball', labels: true, lone: true, spin: !reduceMotion, vibrate: false, separation: 0 };
    const pivot = new THREE.Group();
    pivot.rotation.set(0.35, -0.5, 0);
    let current = null;
    let viewer = null;

    // Küçük moleküller de aynı ölçekte görünsün diye alt sınır kullanılır.
    const fit = () => {
        if (!viewer || !current) return;
        const radius = Math.max(current.userData.radius, 1.5) * (1 + state.separation * 0.9);
        viewer.camera.position.set(0, 0, fitDistance(viewer.camera, radius, 1.35));
        viewer.camera.lookAt(0, 0, 0);
    };

    viewer = createViewer(host, { fov: 35, onResize: fit });
    viewer.scene.add(pivot);

    const renderInfo = () => renderMoleculeInfo(state.key, host);

    function rebuild() {
        if (current) pivot.remove(current);
        current = buildMolecule(MOLECULES[state.key], { mode: state.mode, labels: state.labels, lonePairs: state.lone });
        pivot.add(current);
        fit();
        renderInfo();
    }

    const press = (selector, active) => {
        document.querySelectorAll(selector).forEach((b) => b.setAttribute('aria-pressed', String(b === active)));
    };

    document.querySelectorAll('[data-mol]').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.key = btn.dataset.mol;
            press('[data-mol]', btn);
            btn.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
            rebuild();
        });
    });
    document.querySelectorAll('[data-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.mode = btn.dataset.mode;
            press('[data-mode]', btn);
            rebuild();
        });
    });

    const bind = (id, apply) => {
        const box = $(id);
        if (!box) return;
        box.addEventListener('change', () => apply(box.checked));
    };
    bind('lab-labels', (on) => { state.labels = on; rebuild(); });
    bind('lab-lone', (on) => { state.lone = on; rebuild(); });
    bind('lab-spin', (on) => { state.spin = on; });
    bind('lab-vibrate', (on) => { state.vibrate = on; });
    $('lab-separation')?.addEventListener('input', (event) => {
        state.separation = Number(event.target.value) / 100;
        $('lab-separation-value').textContent = state.separation ? `%${Math.round(state.separation * 100)} açık` : 'Birlikte';
        fit();
    });
    const spinBox = $('lab-spin');
    if (spinBox) spinBox.checked = state.spin;

    const drag = viewerControls(host, pivot, viewer, fit);
    rebuild();

    runWhenVisible(host, (dt, time) => {
        if (state.spin && !drag.dragging) pivot.rotation.y += dt * 0.5;
        if (current) {
            deformMolecule(current, state.separation, time, state.vibrate && !reduceMotion);
            faceLabels(current, viewer.camera);
        }
        viewer.renderer.render(viewer.scene, viewer.camera);
    });
}

// ============================================
// 3. Tepkime animasyonu: CH4 + 2O2 → CO2 + 2H2O
// ============================================
const REACTION = {
    atoms: ['C', 'H', 'H', 'H', 'H', 'O', 'O', 'O', 'O'],
    // Reaktifler: metan solda, iki O2 molekülü sağda.
    start: [
        [-3.2, 0, 0],
        [-3.2 + TETRA, TETRA, TETRA],
        [-3.2 - TETRA, TETRA, -TETRA],
        [-3.2 + TETRA, -TETRA, -TETRA],
        [-3.2 - TETRA, -TETRA, TETRA],
        [2.195, 1.5, 0], [3.405, 1.5, 0],
        [2.195, -1.5, 0], [3.405, -1.5, 0],
    ],
    // Ürünler: ortada CO2, üstte ve altta birer H2O (104,5°).
    end: [
        [0, 0, 0],
        [-0.759, 2.787, 0], [0.759, 2.787, 0],
        [-0.759, -2.787, 0], [0.759, -2.787, 0],
        [0, 2.2, 0], [1.16, 0, 0],
        [0, -2.2, 0], [-1.16, 0, 0],
    ],
    // Her atomun başta ve sonda ait olduğu molekül (bağlar kırılırken ondan uzaklaşır).
    startGroup: [0, 0, 0, 0, 0, 1, 1, 2, 2],
    endGroup: [0, 1, 1, 2, 2, 1, 0, 2, 0],
    startBonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [5, 6, 2], [7, 8, 2]],
    endBonds: [[0, 6, 2], [0, 8, 2], [5, 1, 1], [5, 2, 1], [7, 3, 1], [7, 4, 1]],
    // Atomlar yer değiştirirken birbirinin içinden geçmesin diye derinlikte yay çizer.
    arc: [0, 1.4, -1.2, 1.2, -1.4, 1.0, -1.6, -1.0, 1.6],
};

const STEP_EDGES = [0.08, 0.35, 0.7, 0.92];
const CAPTIONS = [
    'Reaktifler: 1 CH<sub>4</sub> + 2 O<sub>2</sub>',
    'Bağlar kırılıyor (enerji gerekir)',
    'Atomlar yeniden düzenleniyor',
    'Yeni bağlar kuruluyor (enerji açığa çıkar)',
    'Ürünler: 1 CO<sub>2</sub> + 2 H<sub>2</sub>O',
];

const segment = (p, a, b) => THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
const smooth = (s) => s * s * (3 - 2 * s);

function initReaction() {
    const host = $('reaction-3d');
    if (!host) return;

    const pivot = new THREE.Group();
    pivot.rotation.set(0.25, -0.3, 0);
    let viewer = null;
    const fit = () => {
        if (!viewer) return;
        viewer.camera.position.set(0, 0, fitDistance(viewer.camera, 3.3, 1.0));
        viewer.camera.lookAt(0, 0, 0);
    };
    viewer = createViewer(host, { fov: 38, onResize: fit });
    viewer.scene.add(pivot);
    fit();

    const toVector = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const R = REACTION.start.map(toVector);
    const P = REACTION.end.map(toVector);
    const centroid = (points, groups, g) => {
        const c = new THREE.Vector3();
        let n = 0;
        points.forEach((p, i) => {
            if (groups[i] === g) { c.add(p); n++; }
        });
        return c.divideScalar(n);
    };
    const spread = (points, groups) => points.map((p, i) => {
        const c = centroid(points, groups, groups[i]);
        return c.clone().add(p.clone().sub(c).multiplyScalar(1.7));
    });
    const S = spread(R, REACTION.startGroup);
    const Q = spread(P, REACTION.endGroup);

    const atoms = REACTION.atoms.map((symbol, i) => {
        const atom = new THREE.Group();
        const mesh = new THREE.Mesh(sphereGeometry, atomMaterial(symbol));
        mesh.scale.setScalar(ELEMENTS[symbol].ball);
        atom.add(mesh);
        atom.add(createLabel(symbol, 0.4));
        atom.position.copy(R[i]);
        pivot.add(atom);
        return atom;
    });

    const GRAY = new THREE.Color(BOND_COLOR);
    const CORAL = new THREE.Color(0xe4572e);
    const MINT = new THREE.Color(0x2ec4b6);
    const breakMaterial = new THREE.MeshStandardMaterial({ color: BOND_COLOR, roughness: 0.45, transparent: true });
    const formMaterial = new THREE.MeshStandardMaterial({ color: BOND_COLOR, roughness: 0.45, transparent: true, opacity: 0 });
    const makeBonds = (list, material) => list.map(([i, j, order]) => {
        const bond = createBond(order, material);
        pivot.add(bond);
        return { bond, i, j };
    });
    const oldBonds = makeBonds(REACTION.startBonds, breakMaterial);
    const newBonds = makeBonds(REACTION.endBonds, formMaterial);

    const steps = Array.from(document.querySelectorAll('.reaction-steps li'));
    const caption = $('reaction-caption');
    const range = $('reaction-progress');
    const playBtn = $('reaction-play');
    const resetBtn = $('reaction-reset');
    const DURATION = 9;
    const speed = $('reaction-speed');
    const percent = $('reaction-percent');
    let progress = 0;
    let playing = false;
    let shownStep = -1;

    function apply(p) {
        const s1 = smooth(segment(p, STEP_EDGES[0], STEP_EDGES[1]));
        const s2 = smooth(segment(p, STEP_EDGES[1], STEP_EDGES[2]));
        const s3 = smooth(segment(p, STEP_EDGES[2], STEP_EDGES[3]));

        atoms.forEach((atom, i) => {
            if (p < STEP_EDGES[1]) {
                atom.position.lerpVectors(R[i], S[i], s1);
            } else if (p < STEP_EDGES[2]) {
                atom.position.lerpVectors(S[i], Q[i], s2);
                atom.position.z += Math.sin(Math.PI * s2) * REACTION.arc[i];
            } else {
                atom.position.lerpVectors(Q[i], P[i], s3);
            }
        });

        // Kırılan bağlar önce kırmızıya döner sonra kaybolur; yeni bağlar yeşilden griye belirir.
        breakMaterial.opacity = 1 - s1;
        breakMaterial.color.lerpColors(GRAY, CORAL, Math.min(1, s1 * 2.5));
        formMaterial.opacity = s3;
        formMaterial.color.lerpColors(MINT, GRAY, s3);
        oldBonds.forEach(({ bond, i, j }) => {
            bond.visible = s1 < 0.999;
            if (bond.visible) updateBond(bond, atoms[i].position, atoms[j].position);
        });
        newBonds.forEach(({ bond, i, j }) => {
            bond.visible = s3 > 0.001;
            if (bond.visible) updateBond(bond, atoms[i].position, atoms[j].position);
        });

        const step = STEP_EDGES.filter((edge) => p >= edge).length;
        if (step !== shownStep) {
            shownStep = step;
            steps.forEach((li, k) => {
                li.classList.toggle('active', k === step);
                li.classList.toggle('done', k < step);
            });
            if (caption) caption.innerHTML = CAPTIONS[step];
            document.querySelectorAll('[data-reaction-step]').forEach((button, index) => {
                if (index === step) button.setAttribute('aria-current', 'step');
                else button.removeAttribute('aria-current');
            });
        }
    }

    const syncButton = () => {
        if (playBtn) playBtn.textContent = playing ? 'Duraklat' : progress >= 1 ? 'Tekrar oynat' : 'Tepkimeyi oynat';
    };
    playBtn?.addEventListener('click', () => {
        if (progress >= 1) progress = 0;
        playing = !playing;
        syncButton();
    });
    resetBtn?.addEventListener('click', () => {
        progress = 0;
        playing = false;
        if (range) range.value = '0';
        syncButton();
    });
    range?.addEventListener('input', () => {
        progress = Number(range.value) / 1000;
        playing = false;
        syncButton();
    });

    document.querySelectorAll('[data-reaction-step]').forEach((button) => {
        button.addEventListener('click', () => {
            progress = [0, 0.2, 0.5, 0.82, 1][Number(button.dataset.reactionStep)];
            playing = false;
            if (range) range.value = String(progress * 1000);
            syncButton();
        });
    });
    viewerControls(host, pivot, viewer, fit);
    apply(0);
    syncButton();

    runWhenVisible(host, (dt) => {
        if (playing) {
            progress = Math.min(1, progress + dt * Number(speed?.value || 1) / DURATION);
            if (progress >= 1) {
                playing = false;
                syncButton();
            }
            if (range) range.value = String(Math.round(progress * 1000));
        }
        apply(progress);
        if (percent) percent.textContent = `${Math.round(progress * 100)}%`;
        viewer.renderer.render(viewer.scene, viewer.camera);
    });
}

const ATOM_DATA = {
    H: { name: 'Hidrojen', protons: 1, neutrons: 0, shells: [1], note: 'En hafif elementtir. Tek elektronunu paylaşarak H₂ gibi moleküller oluşturabilir.' },
    C: { name: 'Karbon', protons: 6, neutrons: 6, shells: [2, 4], note: 'Son katmanında 4 elektron bulunur. Metandaki dört C–H bağı ve organik moleküllerin omurgası karbonla kurulur.' },
    N: { name: 'Azot', protons: 7, neutrons: 7, shells: [2, 5], note: 'Son katmanında 5 elektron bulunur. Amonyakta üç hidrojenle bağ yapar; bir elektron çifti ortaklanmadan kalır.' },
    O: { name: 'Oksijen', protons: 8, neutrons: 8, shells: [2, 6], note: 'Son katmanında 6 elektron bulunur. Su molekülünde iki hidrojen atomuyla bağ kurar.' },
};
let selectedAtom = 'O';
let updateAtomModel = null;
function updateAtomInfo(symbol) {
    selectedAtom = symbol;
    const data = ATOM_DATA[symbol];
    const set = (id, text) => { if ($(id)) $(id).textContent = text; };
    set('atom-name', data.name);
    set('atom-stage-name', `${data.name} · ${symbol}`);
    set('atom-isotope', `${data.name}-${data.protons + data.neutrons} · nötr atom`);
    set('atom-protons', data.protons);
    set('atom-neutrons', data.neutrons);
    set('atom-electrons', data.protons);
    set('atom-shells', data.shells.join(' · '));
    set('atom-note', data.note);
    $('atom-3d')?.setAttribute('aria-label', `${data.name} atomunun şematik üç boyutlu modeli`);
    document.querySelectorAll('[data-element]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.element === symbol)));
    updateAtomModel?.(symbol);
}
document.querySelectorAll('[data-element]').forEach((button) => button.addEventListener('click', () => updateAtomInfo(button.dataset.element)));

function initAtom() {
    const host = $('atom-3d');
    const pivot = new THREE.Group();
    pivot.rotation.set(0.35, -0.5, 0);
    let viewer = null;
    const fit = () => {
        if (!viewer) return;
        viewer.camera.position.set(0, 0, fitDistance(viewer.camera, 3.0, 1.05));
        viewer.camera.lookAt(0, 0, 0);
    };
    viewer = createViewer(host, { fov: 38, onResize: fit });
    viewer.scene.add(pivot);
    fit();
    const proton = new THREE.MeshStandardMaterial({ color: 0xf07854, roughness: 0.3 });
    const neutron = new THREE.MeshStandardMaterial({ color: 0x73e4c6, roughness: 0.3 });
    const electron = new THREE.MeshStandardMaterial({ color: 0xffd672, emissive: 0xffb52c, emissiveIntensity: 0.5, roughness: 0.25 });
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x73e4c6, transparent: true, opacity: 0.3 });
    let atom = null;
    let orbits = [];
    let running = !reduceMotion;
    let time = 0;
    const motion = $('atom-motion');
    const sync = () => {
        motion.textContent = running ? 'Elektronları duraklat' : 'Elektronları hareket ettir';
        motion.setAttribute('aria-pressed', String(running));
    };
    motion.addEventListener('click', () => { running = !running; sync(); });
    sync();
    updateAtomModel = (symbol) => {
        if (atom) {
            pivot.remove(atom);
            atom.traverse((object) => { if (object.isLineLoop) object.geometry.dispose(); });
        }
        atom = new THREE.Group();
        const data = ATOM_DATA[symbol];
        const total = data.protons + data.neutrons;
        for (let i = 0; i < total; i++) {
            const particle = new THREE.Mesh(sphereGeometry, i % 2 === 0 || i >= data.neutrons * 2 ? proton : neutron);
            particle.scale.setScalar(0.2);
            if (total > 1) {
                const y = 1 - i / (total - 1) * 2;
                const radius = Math.sqrt(1 - y * y);
                const angle = i * Math.PI * (3 - Math.sqrt(5));
                particle.position.set(Math.cos(angle) * radius * 0.5, y * 0.5, Math.sin(angle) * radius * 0.5);
            }
            atom.add(particle);
        }
        orbits = data.shells.map((count, index) => {
            const radius = 1.35 + index * 1.1;
            const orbit = new THREE.Group();
            orbit.rotation.set(0.65 + index * 0.4, index * 0.45, index * 0.2);
            const points = Array.from({ length: 100 }, (_, i) => new THREE.Vector3(Math.cos(i / 100 * Math.PI * 2) * radius, Math.sin(i / 100 * Math.PI * 2) * radius, 0));
            orbit.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), orbitMaterial));
            const electrons = Array.from({ length: count }, () => {
                const mesh = new THREE.Mesh(sphereGeometry, electron);
                mesh.scale.setScalar(0.105);
                orbit.add(mesh);
                return mesh;
            });
            atom.add(orbit);
            return { electrons, radius, speed: 0.7 - index * 0.2 };
        });
        pivot.add(atom);
    };
    updateAtomModel(selectedAtom);
    const drag = viewerControls(host, pivot, viewer, fit);
    runWhenVisible(host, (dt) => {
        if (running) time += dt;
        if (running && !drag.dragging && !reduceMotion) pivot.rotation.y += dt * 0.08;
        orbits.forEach(({ electrons, radius, speed }) => electrons.forEach((mesh, index) => {
            const angle = time * speed + index / electrons.length * Math.PI * 2;
            mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
        }));
        viewer.renderer.render(viewer.scene, viewer.camera);
    });
}

if (hasWebGL()) {
    lazyScene('hero-3d', initHero);
    lazyScene('lab-3d', initLab);
    lazyScene('atom-3d', initAtom);
    lazyScene('reaction-3d', initReaction);
} else {
    document.documentElement.classList.add('no-webgl');
    document.querySelectorAll('[data-mol]').forEach((button) => button.addEventListener('click', () => {
        document.querySelectorAll('[data-mol]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
        renderMoleculeInfo(button.dataset.mol, $('lab-3d'));
    }));
    document.querySelectorAll('[data-reaction-step]').forEach((button) => { button.disabled = true; });
}
