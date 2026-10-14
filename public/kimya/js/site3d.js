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

function hasWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch (err) {
        return false;
    }
}

function safely(init) {
    try {
        init();
    } catch (err) {
        console.error(err);
        document.documentElement.classList.add('no-webgl');
    }
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
    const keys = ['ch4', 'h2o', 'co2', 'nh3', 'o2', 'h2o', 'ch4', 'n2', 'co2', 'h2o', 'nh3', 'ch4', 'o2', 'h2o', 'co2', 'ch4'];
    const items = keys.map((key) => {
        const group = buildMolecule(MOLECULES[key]);
        group.scale.setScalar(0.9 + random() * 0.8);
        // Moleküller çoğunlukla sağ tarafta: sol taraf başlık metnine ayrılır.
        group.position.set(2.5 + random() * 9, -5.5 + random() * 11, -10 + random() * 10);
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
function initLab() {
    const host = $('lab-3d');
    if (!host) return;

    const state = { key: 'h2o', mode: 'ball', labels: true, lone: true, spin: !reduceMotion };
    const pivot = new THREE.Group();
    pivot.rotation.set(0.35, -0.5, 0);
    let current = null;
    let viewer = null;

    // Küçük moleküller de aynı ölçekte görünsün diye alt sınır kullanılır.
    const fit = () => {
        if (!viewer || !current) return;
        const radius = Math.max(current.userData.radius, 1.5);
        viewer.camera.position.set(0, 0, fitDistance(viewer.camera, radius, 1.35));
        viewer.camera.lookAt(0, 0, 0);
    };

    viewer = createViewer(host, { fov: 35, onResize: fit });
    viewer.scene.add(pivot);

    const setText = (id, value, html = false) => {
        const el = $(id);
        if (!el) return;
        if (html) el.innerHTML = value;
        else el.textContent = value;
    };

    function renderInfo() {
        const m = MOLECULES[state.key];
        setText('mol-name', m.name);
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
    const spinBox = $('lab-spin');
    if (spinBox) spinBox.checked = state.spin;

    const drag = attachDragRotate(host, pivot);
    rebuild();

    runWhenVisible(host, (dt) => {
        if (state.spin && !drag.dragging) pivot.rotation.y += dt * 0.5;
        if (current) faceLabels(current, viewer.camera);
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
        }
    }

    const syncButton = () => {
        if (playBtn) playBtn.textContent = playing ? 'Duraklat' : progress >= 1 ? 'Tekrar oynat' : 'Oynat';
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

    attachDragRotate(host, pivot);
    apply(0);
    syncButton();

    // Bölüm ilk kez göründüğünde animasyon kendiliğinden başlar.
    if (!reduceMotion && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            setTimeout(() => {
                if (progress === 0 && !playing) {
                    playing = true;
                    syncButton();
                }
            }, 700);
        }, { threshold: 0.5 });
        io.observe(host);
    }

    runWhenVisible(host, (dt) => {
        if (playing) {
            progress = Math.min(1, progress + dt / DURATION);
            if (progress >= 1) {
                playing = false;
                syncButton();
            }
            if (range) range.value = String(Math.round(progress * 1000));
        }
        apply(progress);
        viewer.renderer.render(viewer.scene, viewer.camera);
    });
}

if (hasWebGL()) {
    safely(initHero);
    safely(initLab);
    safely(initReaction);
} else {
    document.documentElement.classList.add('no-webgl');
}
