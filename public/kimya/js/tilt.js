// Kartlara hafif 3D eğim efekti. Yalnızca fareyle çalışır; "hareketi azalt" tercihi varsa kapalıdır.
(function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduce || !finePointer) return;

    document.querySelectorAll('[data-tilt]').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = 'perspective(700px) rotateX(' + (-y * 10).toFixed(2) + 'deg) rotateY(' +
                (x * 12).toFixed(2) + 'deg) translateY(-4px)';
        });
        card.addEventListener('pointerleave', function () {
            card.style.transform = '';
        });
    });
})();
