/* =========================================================
   MIDUS LOUNGE – gemeinsame UI-Bausteine
   - Neon-Popups statt grauer Browser-Fenster (uiAlert / uiConfirm)
   - Beschriftung der Tab-Leiste
   ========================================================= */
(function () {
    const css = `
    /* --- Tab-Leiste mit Beschriftung --- */
    .tab-link { flex-direction: column; gap: 3px; padding: 6px 2px !important; }
    .tab-link .tab-label { font-size: 11px; font-weight: 600; color: #666; letter-spacing: 0.3px; font-family: 'Segoe UI', sans-serif; }
    .tab-link.active .tab-label { color: var(--cyan, #00d2ff); }
    .tab-link svg { width: 24px !important; height: 24px !important; }

    /* --- Neon-Popup --- */
    .ui-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9000; display: flex; justify-content: center; align-items: center; padding: 24px; opacity: 0; transition: opacity 0.2s ease; }
    .ui-overlay.show { opacity: 1; }
    .ui-box { width: 100%; max-width: 340px; background: #121212; border: 1.5px solid var(--ui-color, #00d2ff); border-radius: 20px; padding: 26px 20px 20px; text-align: center; box-shadow: 0 0 35px color-mix(in srgb, var(--ui-color, #00d2ff) 30%, transparent); transform: scale(0.9); transition: transform 0.2s ease; }
    .ui-overlay.show .ui-box { transform: scale(1); }
    .ui-icon { font-size: 44px; margin-bottom: 8px; }
    .ui-title { color: #fff; font-size: 20px; font-weight: 800; margin-bottom: 10px; line-height: 1.3; font-family: 'Segoe UI', sans-serif; }
    .ui-text { color: #bbb; font-size: 15px; line-height: 1.5; margin-bottom: 22px; white-space: pre-line; font-family: 'Segoe UI', sans-serif; }
    .ui-text b { color: #fff; }
    .ui-buttons { display: flex; gap: 10px; }
    .ui-btn { flex: 1; padding: 14px; border-radius: 12px; border: none; font-size: 16px; font-weight: 800; cursor: pointer; font-family: 'Segoe UI', sans-serif; }
    .ui-btn.primary { background: var(--ui-color, #00d2ff); color: #000; }
    .ui-btn.secondary { background: transparent; color: #aaa; border: 1px solid #333; }
    .ui-btn:active { transform: scale(0.97); }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Tab-Beschriftungen automatisch ergänzen
    const labels = { 'index.html': 'Home', 'karte.html': 'Karte', 'scanner.html': 'Scan', 'events.html': 'Events', 'kontakt.html': 'Kontakt' };
    function addTabLabels() {
        document.querySelectorAll('.tab-link').forEach(a => {
            const name = labels[a.getAttribute('href')];
            if (name && !a.querySelector('.tab-label')) {
                const s = document.createElement('span');
                s.className = 'tab-label';
                s.textContent = name;
                a.appendChild(s);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addTabLabels);
    else addTabLabels();

    const colors = { info: '#00d2ff', success: '#00ff66', error: '#ff3333', pink: '#ff007f', gold: '#ffaa00' };

    // Allgemeines Popup – gibt ein Promise zurück (true = Hauptbutton)
    window.uiPopup = function ({ icon = '', title = '', text = '', type = 'info', ok = 'OK', cancel = null }) {
        return new Promise(resolve => {
            const ov = document.createElement('div');
            ov.className = 'ui-overlay';
            ov.innerHTML = `
                <div class="ui-box" style="--ui-color:${colors[type] || type}">
                    ${icon ? `<div class="ui-icon">${icon}</div>` : ''}
                    ${title ? `<div class="ui-title"></div>` : ''}
                    ${text ? `<div class="ui-text"></div>` : ''}
                    <div class="ui-buttons">
                        ${cancel ? `<button class="ui-btn secondary" data-r="0"></button>` : ''}
                        <button class="ui-btn primary" data-r="1"></button>
                    </div>
                </div>`;
            if (title) ov.querySelector('.ui-title').textContent = title;
            if (text) ov.querySelector('.ui-text').innerHTML = text; // nur eigene Texte, kein Gast-Input ungefiltert
            ov.querySelector('[data-r="1"]').textContent = ok;
            if (cancel) ov.querySelector('[data-r="0"]').textContent = cancel;
            ov.querySelectorAll('.ui-btn').forEach(b => b.onclick = () => {
                ov.classList.remove('show');
                setTimeout(() => ov.remove(), 200);
                resolve(b.dataset.r === '1');
            });
            document.body.appendChild(ov);
            requestAnimationFrame(() => ov.classList.add('show'));
        });
    };

    window.uiAlert = (title, text = '', type = 'info', icon = '') => uiPopup({ title, text, type, icon });
    window.uiConfirm = (title, text = '', okText = 'Ja', cancelText = 'Abbrechen', type = 'pink', icon = '') =>
        uiPopup({ title, text, type, icon, ok: okText, cancel: cancelText });

    // Hilfsfunktion: Text sicher in HTML einsetzen
    window.uiEsc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})();
