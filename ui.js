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

    /* =========================================================
       HINWEIS „ZUM HOMESCREEN HINZUFÜGEN“
       - nur im Browser (nicht wenn die App schon installiert ist)
       - nach „Später“ erst nach 7 Tagen wieder, nach „Nicht mehr zeigen“ nie wieder
       ========================================================= */
    const ls = {
        get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
        set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} }
    };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = isIOS || /android/i.test(navigator.userAgent);
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
    window.addEventListener('appinstalled', () => { ls.set('midus_a2hs', 'never'); hideA2HS(); });

    const a2hsCss = `
    .a2hs { position: fixed; left: 50%; bottom: calc(80px + env(safe-area-inset-bottom, 0px)); transform: translate(-50%, 30px); width: calc(100% - 24px); max-width: 396px; background: #121212; border: 1.5px solid #00d2ff; border-radius: 16px; padding: 14px; z-index: 8000; box-shadow: 0 0 25px rgba(0,210,255,0.25), 0 10px 30px rgba(0,0,0,0.7); opacity: 0; transition: all 0.35s ease; font-family: 'Segoe UI', sans-serif; }
    .a2hs.show { opacity: 1; transform: translate(-50%, 0); }
    .a2hs-top { display: flex; gap: 12px; align-items: center; }
    .a2hs-top img { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; }
    .a2hs-title { color: #fff; font-size: 16px; font-weight: 800; }
    .a2hs-text { color: #bbb; font-size: 14px; line-height: 1.4; margin-top: 2px; }
    .a2hs-text b { color: #00d2ff; }
    .a2hs-btns { display: flex; gap: 8px; margin-top: 12px; }
    .a2hs-btns button { flex: 1; padding: 11px; border-radius: 10px; font-size: 14px; font-weight: 800; cursor: pointer; border: none; font-family: 'Segoe UI', sans-serif; }
    .a2hs-main { background: #00d2ff; color: #000; }
    .a2hs-later { background: transparent; color: #aaa; border: 1px solid #333 !important; }
    .a2hs-never { display: block; width: auto !important; padding: 4px 8px !important; margin: 8px auto 0; background: none; border: none; color: #666; font-size: 12px; text-decoration: underline; cursor: pointer; }
    .a2hs-share { display: inline-block; vertical-align: -3px; width: 16px; height: 16px; }
    `;

    function hideA2HS() {
        const el = document.getElementById('a2hs');
        if (!el) return;
        el.classList.remove('show');
        setTimeout(() => el.remove(), 400);
    }

    function showA2HS() {
        if (isStandalone || !isMobile || document.getElementById('a2hs')) return;
        const state = ls.get('midus_a2hs');
        if (state === 'never') return;
        if (state && Date.now() < Number(state)) return; // „Später“ gedrückt -> noch warten

        const st = document.createElement('style'); st.textContent = a2hsCss; document.head.appendChild(st);

        const shareIcon = `<svg class="a2hs-share" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>`;
        let text, mainBtn;
        if (isIOS) {
            text = `Tippe unten auf ${shareIcon} <b>Teilen</b> und dann auf <b>„Zum Home-Bildschirm“</b>.`;
            mainBtn = 'Verstanden';
        } else if (deferredPrompt) {
            text = `Speichere die Midus VIP-App auf deinem Handy – so hast du deine Pointz immer griffbereit.`;
            mainBtn = 'Installieren';
        } else {
            text = `Tippe oben rechts auf <b>⋮</b> und dann auf <b>„App installieren“</b> bzw. <b>„Zum Startbildschirm“</b>.`;
            mainBtn = 'Verstanden';
        }

        const el = document.createElement('div');
        el.className = 'a2hs'; el.id = 'a2hs';
        el.innerHTML = `
            <div class="a2hs-top">
                <img src="icon-192.png" alt="">
                <div>
                    <div class="a2hs-title">Hol dir die App aufs Handy 📲</div>
                    <div class="a2hs-text">${text}</div>
                </div>
            </div>
            <div class="a2hs-btns">
                <button class="a2hs-later">Später</button>
                <button class="a2hs-main">${mainBtn}</button>
            </div>
            <button class="a2hs-never">Nicht mehr anzeigen</button>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));

        el.querySelector('.a2hs-later').onclick = () => { ls.set('midus_a2hs', String(Date.now() + 7 * 86400000)); hideA2HS(); };
        el.querySelector('.a2hs-never').onclick = () => { ls.set('midus_a2hs', 'never'); hideA2HS(); };
        el.querySelector('.a2hs-main').onclick = async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice.catch(() => null);
                deferredPrompt = null;
                ls.set('midus_a2hs', choice && choice.outcome === 'accepted' ? 'never' : String(Date.now() + 7 * 86400000));
            } else {
                // Anleitung gelesen -> in 7 Tagen nochmal erinnern, falls noch nicht installiert
                ls.set('midus_a2hs', String(Date.now() + 7 * 86400000));
            }
            hideA2HS();
        };
    }

    // Kurz warten, damit die Seite erst lädt (und Android die Installation anbieten kann)
    window.addEventListener('load', () => setTimeout(showA2HS, 2500));

    // Hilfsfunktion: Text sicher in HTML einsetzen
    window.uiEsc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})();
