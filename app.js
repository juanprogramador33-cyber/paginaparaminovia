(function () {
  "use strict";

  const STORAGE_KEYS = {
    overrides: "birthday_gift_overrides_v1",
    vouchers: "birthday_gift_vouchers_v1",
  };

  const IDB_NAME = "BirthdayGiftPhotosDB";
  const IDB_STORE = "photos";

  const baseConfig = JSON.parse(JSON.stringify(window.BIRTHDAY_CONFIG || {}));
  let activeOverrides = loadOverrides();
  let uploadedPhotoUrls = {}; // { [srcKey]: objectUrlOrDataUrl }
  let activeCategory = "Todas";
  let currentFilteredPhotos = [];
  let lightboxIndex = 0;
  let spotlightIndex = 0;
  let redeemedVouchers = loadRedeemedVouchers();

  // --- Utilidades de almacenamiento seguro ---
  function loadOverrides() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.overrides);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveOverrides(next) {
    activeOverrides = next;
    try {
      localStorage.setItem(STORAGE_KEYS.overrides, JSON.stringify(next));
    } catch (_) {
      // Ignorar en modo privado estricto
    }
  }

  function loadRedeemedVouchers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.vouchers);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function saveRedeemedVouchers(next) {
    redeemedVouchers = next;
    try {
      localStorage.setItem(STORAGE_KEYS.vouchers, JSON.stringify(next));
    } catch (_) {
      // Ignorar
    }
  }

  // --- IndexedDB para fotos de vista previa ---
  function openPhotoDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB no disponible"));
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadAllSavedPhotos() {
    try {
      const db = await openPhotoDB();
      return await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.openCursor();
        const map = {};
        req.onsuccess = (ev) => {
          const cursor = ev.target.result;
          if (cursor) {
            map[cursor.key] = cursor.value;
            cursor.continue();
          } else {
            resolve(map);
          }
        };
        req.onerror = () => resolve({});
      });
    } catch (_) {
      return {};
    }
  }

  async function savePhotoBlob(key, dataUrl) {
    try {
      const db = await openPhotoDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put(dataUrl, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {
      // Ignorar si falla IndexedDB
    }
  }

  async function clearSavedPhotos() {
    try {
      const db = await openPhotoDB();
      await new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).clear();
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    } catch (_) {
      // Ignorar
    }
  }

  // --- Combinar configuración + overrides + reemplazo de tokens ---
  function getEffectiveConfig() {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    const h = cfg.hero || {};
    if (activeOverrides.nombreElla) h.nombreElla = activeOverrides.nombreElla;
    if (activeOverrides.tuNombre) h.tuNombre = activeOverrides.tuNombre;
    if (activeOverrides.apodo) h.apodo = activeOverrides.apodo;
    if (activeOverrides.edad !== undefined) h.edad = activeOverrides.edad;
    if (activeOverrides.fechaCumpleanos) h.fechaCumpleanos = activeOverrides.fechaCumpleanos;
    if (activeOverrides.fechaInicioRelacion !== undefined) {
      h.fechaInicioRelacion = activeOverrides.fechaInicioRelacion;
    }
    cfg.hero = h;

    const carta = cfg.carta || {};
    if (activeOverrides.cartaSaludo !== undefined) carta.saludo = activeOverrides.cartaSaludo;
    if (activeOverrides.cartaFirma !== undefined) carta.firma = activeOverrides.cartaFirma;
    if (Array.isArray(activeOverrides.cartaParrafos)) {
      carta.parrafos = activeOverrides.cartaParrafos;
    }
    cfg.carta = carta;

    const razones = cfg.razones || {};
    if (Array.isArray(activeOverrides.razonesLista)) {
      razones.lista = activeOverrides.razonesLista;
    }
    cfg.razones = razones;

    const cancion = cfg.cancion || {};
    if (activeOverrides.cancionNombre !== undefined) {
      cancion.nombreCancion = activeOverrides.cancionNombre;
    }
    if (activeOverrides.cancionArtista !== undefined) {
      cancion.artista = activeOverrides.cancionArtista;
    }
    if (activeOverrides.cancionEnlace !== undefined) {
      cancion.enlaceExterno = activeOverrides.cancionEnlace;
    }
    cfg.cancion = cancion;

    return cfg;
  }

  function applyPlaceholders(text, hero) {
    if (typeof text !== "string") return "";
    let out = text;
    if (hero.nombreElla) out = out.replaceAll("[NOMBRE DE ELLA]", hero.nombreElla);
    if (hero.tuNombre) out = out.replaceAll("[TU NOMBRE]", hero.tuNombre);
    if (hero.apodo) out = out.replaceAll("[APODO CARIÑOSO]", hero.apodo);
    if (hero.edad) out = out.replaceAll("[XX]", hero.edad);
    return out;
  }

  function resolvePhotoSrc(path) {
    if (uploadedPhotoUrls[path]) return uploadedPhotoUrls[path];
    return path;
  }

  // --- Renderizador seguro de imagen con placeholder elegante ---
  function renderMediaSlot(container, srcPath, altText, labelHint, fallbackPath) {
    container.innerHTML = "";
    const resolved = resolvePhotoSrc(srcPath);

    const img = document.createElement("img");
    img.src = resolved;
    img.alt = altText || "Recuerdo especial";
    img.loading = "lazy";

    let triedFallback = false;
    img.addEventListener("error", () => {
      if (!triedFallback && fallbackPath && fallbackPath !== srcPath) {
        triedFallback = true;
        img.src = resolvePhotoSrc(fallbackPath);
        return;
      }
      container.innerHTML = "";
      container.appendChild(createPhotoPlaceholder(srcPath, labelHint));
    });

    container.appendChild(img);
  }

  function createPhotoPlaceholder(expectedPath, hint) {
    const box = document.createElement("div");
    box.className = "photo-placeholder";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", "3");
    rect.setAttribute("y", "5");
    rect.setAttribute("width", "18");
    rect.setAttribute("height", "14");
    rect.setAttribute("rx", "2.5");

    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", "8.5");
    circle.setAttribute("cy", "10");
    circle.setAttribute("r", "1.5");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M21 15l-4.5-4.5L7 19");

    svg.append(rect, circle, path);

    const strong = document.createElement("strong");
    strong.textContent = hint || "Aquí va su foto";

    const code = document.createElement("code");
    code.textContent = expectedPath;

    box.append(svg, strong, code);
    return box;
  }

  // --- Renderizado principal ---
  function renderAll() {
    const cfg = getEffectiveConfig();
    const hero = cfg.hero || {};
    const t = (str) => applyPlaceholders(str, hero);

    document.title = `Feliz Cumpleaños, ${hero.nombreElla || "Mi Amor"}`;
    document.getElementById("nav-brand").textContent = `Para ${hero.nombreElla || "ti"}`;

    // Hero
    document.getElementById("hero-tag").textContent = t(hero.etiquetaSuperior);
    document.getElementById("hero-date").textContent = t(hero.fechaCumpleanos);
    document.getElementById("hero-title").textContent = t(hero.tituloPrincipal);
    document.getElementById("hero-subtitle").textContent = t(hero.subtitulo);

    // Días juntos
    const daysWrap = document.getElementById("stat-days-wrap");
    if (hero.fechaInicioRelacion) {
      const start = new Date(`${hero.fechaInicioRelacion}T00:00:00`);
      const now = new Date();
      const diffDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
      if (!Number.isNaN(diffDays)) {
        daysWrap.hidden = false;
        document.getElementById("stat-days").textContent = diffDays.toLocaleString("es-ES");
        document.getElementById("stat-days-label").textContent = t(hero.etiquetaContador);
      } else {
        daysWrap.hidden = true;
      }
    } else {
      daysWrap.hidden = true;
    }

    // Edad
    const ageWrap = document.getElementById("stat-age-wrap");
    if (hero.edad && String(hero.edad).trim() !== "") {
      ageWrap.hidden = false;
      document.getElementById("stat-age").textContent = t(hero.edad);
    } else {
      ageWrap.hidden = true;
    }

    // Portada (emoji azul celeste o foto)
    const portada = hero.fotoPortada || { src: "fotos/portada.jpg", pieDeFoto: "" };
    const heroPhotoSlot = document.getElementById("hero-photo-slot");
    const heroCaption = document.getElementById("hero-photo-caption");
    const floatingNote = document.querySelector(".floating-note");

    if (portada.emoji) {
      heroPhotoSlot.innerHTML = "";
      const emojiBox = document.createElement("div");
      emojiBox.className = "hero-emoji-display";
      emojiBox.setAttribute("role", "img");
      emojiBox.setAttribute("aria-label", "Corazón azul celeste");
      emojiBox.textContent = portada.emoji;
      heroPhotoSlot.appendChild(emojiBox);
      if (floatingNote) floatingNote.hidden = true;
    } else {
      const firstHitoPhoto = (cfg.historia?.hitos || []).find((h) => h.foto)?.foto || "";
      renderMediaSlot(
        heroPhotoSlot,
        portada.src,
        `Foto principal de ${hero.nombreElla}`,
        "Coloca tu foto de portada",
        firstHitoPhoto
      );
      if (floatingNote) floatingNote.hidden = false;
    }

    const captionText = t(portada.pieDeFoto);
    heroCaption.textContent = captionText;
    heroCaption.hidden = captionText.trim() === "";

    // Historia
    renderTimeline(cfg, t);

    // Galería (solo si existe la sección en el HTML)
    if (document.getElementById("gallery-grid")) {
      renderGallery(cfg, t);
    }

    // Carta
    renderLetter(cfg, t, hero);

    // Razones
    renderReasons(cfg, t);

    // Vales
    renderVouchers(cfg, t);

    // Canción y Cierre
    renderSongAndFooter(cfg, t);

    // Lista de fotos en el panel de edición
    renderEditorPhotoRows(cfg, t);
  }

  function renderTimeline(cfg, t) {
    const historia = cfg.historia || {};
    document.getElementById("historia-title").textContent = t(historia.titulo);
    document.getElementById("historia-subtitle").textContent = t(historia.subtitulo);

    const list = document.getElementById("timeline-list");
    list.innerHTML = "";

    const hitoPhotos = [];
    (historia.hitos || []).forEach((hito) => {
      const item = document.createElement("div");
      item.className = "timeline-item";

      const dot = document.createElement("div");
      dot.className = "timeline-dot";

      const card = document.createElement("article");
      card.className = "timeline-card";

      const info = document.createElement("div");
      const dateSpan = document.createElement("span");
      dateSpan.className = "timeline-date";
      dateSpan.textContent = t(hito.fecha);

      const title = document.createElement("h3");
      title.textContent = t(hito.titulo);

      const desc = document.createElement("p");
      desc.textContent = t(hito.descripcion);

      info.append(dateSpan, title, desc);
      card.appendChild(info);

      if (hito.foto) {
        const photoIdx = hitoPhotos.length;
        hitoPhotos.push({
          src: hito.foto,
          titulo: hito.titulo,
          fecha: hito.fecha,
          categoria: "Nuestra historia",
          nota: hito.descripcion,
        });
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "timeline-thumb";
        thumb.setAttribute("aria-label", `Ver foto: ${t(hito.titulo)}`);
        renderMediaSlot(thumb, hito.foto, t(hito.titulo), "Foto del capítulo");
        thumb.addEventListener("click", () => {
          if (!document.getElementById("gallery-grid")) {
            currentFilteredPhotos = hitoPhotos;
          }
          openLightbox(photoIdx);
        });
        card.appendChild(thumb);
      } else {
        card.classList.add("no-thumb");
      }

      item.append(dot, card);
      list.appendChild(item);
    });

    if (!document.getElementById("gallery-grid")) {
      currentFilteredPhotos = hitoPhotos;
    }
  }

  function renderGallery(cfg, t) {
    const galeria = cfg.galeria || {};
    document.getElementById("galeria-title").textContent = t(galeria.titulo);
    document.getElementById("galeria-subtitle").textContent = t(galeria.subtitulo);

    const fotos = galeria.fotos || [];
    const categories = ["Todas", ...new Set(fotos.map((f) => f.categoria).filter(Boolean))];
    if (!categories.includes(activeCategory)) activeCategory = "Todas";

    const filterBar = document.getElementById("gallery-filters");
    filterBar.innerHTML = "";
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-btn ${cat === activeCategory ? "is-active" : ""}`;
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        activeCategory = cat;
        renderGallery(getEffectiveConfig(), (s) => applyPlaceholders(s, getEffectiveConfig().hero));
      });
      filterBar.appendChild(btn);
    });

    currentFilteredPhotos =
      activeCategory === "Todas"
        ? fotos
        : fotos.filter((f) => f.categoria === activeCategory);

    const grid = document.getElementById("gallery-grid");
    grid.innerHTML = "";
    grid.classList.remove("gallery-grid--one", "gallery-grid--two");
    if (currentFilteredPhotos.length === 1) {
      grid.classList.add("gallery-grid--one");
    } else if (currentFilteredPhotos.length === 2 || currentFilteredPhotos.length === 4) {
      grid.classList.add("gallery-grid--two");
    }

    currentFilteredPhotos.forEach((foto, idx) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gallery-card";
      card.addEventListener("click", () => openLightbox(idx));

      const thumb = document.createElement("div");
      thumb.className = "gallery-thumb";
      renderMediaSlot(thumb, foto.src, t(foto.titulo), "Agregar foto");

      const meta = document.createElement("div");
      meta.className = "gallery-meta";

      const catPill = document.createElement("span");
      catPill.className = "pill pill-sm";
      catPill.textContent = foto.categoria || "Recuerdo";

      const dateSpan = document.createElement("span");
      dateSpan.className = "gallery-date";
      dateSpan.textContent = t(foto.fecha);

      meta.append(catPill, dateSpan);

      const title = document.createElement("h3");
      title.textContent = t(foto.titulo);

      const note = document.createElement("p");
      note.className = "gallery-note";
      note.textContent = t(foto.nota);

      card.append(thumb, meta, title, note);
      grid.appendChild(card);
    });
  }

  function renderLetter(cfg, t, hero) {
    const carta = cfg.carta || {};
    document.getElementById("carta-title").textContent = t(carta.titulo);
    document.getElementById("carta-subtitle").textContent = t(carta.subtitulo);
    document.getElementById("envelope-to").textContent = `Para: ${hero.nombreElla || "Ti"}`;
    document.getElementById("letter-date").textContent = t(hero.fechaCumpleanos);
    document.getElementById("letter-salutation").textContent = t(carta.saludo);

    const body = document.getElementById("letter-body");
    body.innerHTML = "";
    (carta.parrafos || []).forEach((pText) => {
      const p = document.createElement("p");
      p.textContent = t(pText);
      body.appendChild(p);
    });

    document.getElementById("letter-farewell").textContent = t(carta.despedida);
    document.getElementById("letter-signature").textContent = t(carta.firma);
  }

  function renderReasons(cfg, t) {
    const razones = cfg.razones || {};
    document.getElementById("razones-title").textContent = t(razones.titulo);
    document.getElementById("razones-subtitle").textContent = t(razones.subtitulo);

    const lista = razones.lista || [];
    if (lista.length > 0) {
      spotlightIndex = spotlightIndex % lista.length;
      document.getElementById("spotlight-index").textContent = `Razón #${spotlightIndex + 1}`;
      document.getElementById("spotlight-text").textContent = t(lista[spotlightIndex]);
    }

    const grid = document.getElementById("reasons-grid");
    grid.innerHTML = "";
    lista.forEach((reason, i) => {
      const li = document.createElement("li");
      li.className = "reason-item";

      const num = document.createElement("span");
      num.className = "reason-num";
      num.textContent = String(i + 1);

      const p = document.createElement("p");
      p.textContent = t(reason);

      li.append(num, p);
      grid.appendChild(li);
    });
  }

  function renderVouchers(cfg, t) {
    const vales = cfg.vales || {};
    document.getElementById("vales-title").textContent = t(vales.titulo);
    document.getElementById("vales-subtitle").textContent = t(vales.subtitulo);

    const grid = document.getElementById("vouchers-grid");
    grid.innerHTML = "";

    (vales.cupones || []).forEach((cupon) => {
      const isRedeemed = Boolean(redeemedVouchers[cupon.id]);
      const card = document.createElement("article");
      card.className = `voucher-card ${isRedeemed ? "is-redeemed" : ""}`;

      const top = document.createElement("div");
      const tag = document.createElement("span");
      tag.className = "voucher-tag";
      tag.textContent = t(cupon.etiqueta);

      const title = document.createElement("h3");
      title.textContent = t(cupon.titulo);

      const desc = document.createElement("p");
      desc.textContent = t(cupon.descripcion);

      top.append(tag, title, desc);

      const footer = document.createElement("div");
      footer.className = "voucher-footer";

      const status = document.createElement("span");
      status.className = "voucher-status";
      status.textContent = isRedeemed ? "✓ Canjeado con amor" : "Disponible para ti";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `btn btn-sm ${isRedeemed ? "btn-ghost" : "btn-primary"}`;
      btn.textContent = isRedeemed ? "Canjeado" : "Canjear vale";
      btn.addEventListener("click", () => {
        const next = { ...redeemedVouchers };
        if (next[cupon.id]) {
          delete next[cupon.id];
        } else {
          next[cupon.id] = true;
          launchConfetti(80);
        }
        saveRedeemedVouchers(next);
        renderVouchers(getEffectiveConfig(), (s) => applyPlaceholders(s, getEffectiveConfig().hero));
      });

      footer.append(status, btn);
      card.append(top, footer);
      grid.appendChild(card);
    });
  }

  function renderSongAndFooter(cfg, t) {
    const cancion = cfg.cancion || {};
    document.getElementById("cancion-eyebrow").textContent = t(cancion.titulo);
    document.getElementById("cancion-nombre").textContent = t(cancion.nombreCancion);
    document.getElementById("cancion-artista").textContent = t(cancion.artista);
    document.getElementById("cancion-dedicatoria").textContent = t(cancion.dedicatoria);

    const link = document.getElementById("cancion-link");
    if (cancion.enlaceExterno) {
      link.hidden = false;
      link.href = cancion.enlaceExterno;
      link.textContent = t(cancion.textoBoton || "Escuchar canción");
    } else {
      link.hidden = true;
    }

    const cierre = cfg.cierre || {};
    document.getElementById("cierre-titulo").textContent = t(cierre.titulo);
    document.getElementById("cierre-mensaje").textContent = t(cierre.mensaje);
    document.getElementById("footer-text").textContent = t(cierre.textoPie);
  }

  // --- Lightbox ---
  function openLightbox(index) {
    if (!currentFilteredPhotos.length) return;
    lightboxIndex = index;
    updateLightboxContent();
    const lb = document.getElementById("lightbox");
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    document.getElementById("lightbox").hidden = true;
    document.body.style.overflow = "";
  }

  function updateLightboxContent() {
    const cfg = getEffectiveConfig();
    const t = (s) => applyPlaceholders(s, cfg.hero);
    const foto = currentFilteredPhotos[lightboxIndex];
    if (!foto) return;

    renderMediaSlot(
      document.getElementById("lightbox-media"),
      foto.src,
      t(foto.titulo),
      "Coloca aquí tu foto"
    );
    document.getElementById("lightbox-category").textContent = foto.categoria || "Recuerdo";
    document.getElementById("lightbox-date").textContent = t(foto.fecha);
    document.getElementById("lightbox-title").textContent = t(foto.titulo);
    document.getElementById("lightbox-note").textContent = t(foto.nota);
  }

  function stepLightbox(delta) {
    if (!currentFilteredPhotos.length) return;
    lightboxIndex = (lightboxIndex + delta + currentFilteredPhotos.length) % currentFilteredPhotos.length;
    updateLightboxContent();
  }

  // --- Panel de personalización local ---
  function getAllPhotoSlots(cfg) {
    const seen = new Set();
    const slots = [];
    const addSlot = (src, label) => {
      if (!src || seen.has(src)) return;
      seen.add(src);
      slots.push({ src, label });
    };

    (cfg.historia?.hitos || []).forEach((h, i) => {
      addSlot(h.foto, `Hito #${i + 1}: ${h.titulo}`);
    });
    if (!cfg.hero?.fotoPortada?.emoji && cfg.hero?.fotoPortada?.src) {
      addSlot(cfg.hero.fotoPortada.src, "Foto de portada (opcional)");
    }
    if (document.getElementById("gallery-grid")) {
      (cfg.galeria?.fotos || []).forEach((f, i) => {
        addSlot(f.src, `Galería #${i + 1}: ${f.titulo}`);
      });
    }
    return slots;
  }

  function renderEditorPhotoRows(cfg, t) {
    const container = document.getElementById("editor-photos-list");
    if (!container) return;
    container.innerHTML = "";

    getAllPhotoSlots(cfg).forEach((slot) => {
      const row = document.createElement("div");
      row.className = "editor-photo-row";

      const meta = document.createElement("div");
      meta.className = "editor-photo-meta";

      const strong = document.createElement("strong");
      strong.textContent = t(slot.label);

      const span = document.createElement("span");
      span.textContent = uploadedPhotoUrls[slot.src]
        ? `✓ Cargada en vista previa (${slot.src})`
        : slot.src;

      meta.append(strong, span);

      const uploadLabel = document.createElement("label");
      uploadLabel.className = "upload-pill";
      uploadLabel.textContent = uploadedPhotoUrls[slot.src] ? "Cambiar" : "Elegir foto";

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.addEventListener("change", (ev) => {
        const file = ev.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = String(reader.result);
          uploadedPhotoUrls[slot.src] = dataUrl;
          await savePhotoBlob(slot.src, dataUrl);
          renderAll();
        };
        reader.readAsDataURL(file);
      });

      uploadLabel.appendChild(input);
      row.append(meta, uploadLabel);
      container.appendChild(row);
    });
  }

  function syncEditorInputs() {
    const cfg = getEffectiveConfig();
    const hero = cfg.hero || {};
    const carta = cfg.carta || {};
    const razones = cfg.razones || {};
    const cancion = cfg.cancion || {};

    document.getElementById("ed-nombreElla").value = hero.nombreElla || "";
    document.getElementById("ed-apodo").value = hero.apodo || "";
    document.getElementById("ed-tuNombre").value = hero.tuNombre || "";
    document.getElementById("ed-edad").value = hero.edad || "";
    document.getElementById("ed-fechaCumpleanos").value = hero.fechaCumpleanos || "";
    document.getElementById("ed-fechaInicio").value = hero.fechaInicioRelacion || "";

    document.getElementById("ed-cartaSaludo").value = carta.saludo || "";
    document.getElementById("ed-cartaParrafos").value = (carta.parrafos || []).join("\n\n");
    document.getElementById("ed-cartaFirma").value = carta.firma || "";
    document.getElementById("ed-razones").value = (razones.lista || []).join("\n");
    document.getElementById("ed-cancionNombre").value = cancion.nombreCancion || "";
    document.getElementById("ed-cancionArtista").value = cancion.artista || "";
    document.getElementById("ed-cancionEnlace").value = cancion.enlaceExterno || "";
  }

  function downloadUpdatedConfig() {
    const cfg = getEffectiveConfig();
    const content = `window.BIRTHDAY_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;
    const blob = new Blob([content], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // --- Confeti ligero en Canvas ---
  const confettiCanvas = document.getElementById("confetti-canvas");
  const ctx = confettiCanvas.getContext("2d");
  let particles = [];
  let animFrameId = null;

  function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function launchConfetti(count = 110) {
    resizeCanvas();
    const colors = ["#c85263", "#e88d9a", "#c69a5c", "#f3c677", "#8ab6a8", "#ffffff"];
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * 140,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 4.2,
        vy: 2.5 + Math.random() * 4.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }
    if (!animFrameId) {
      animateConfetti();
    }
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles = particles.filter((p) => p.y < confettiCanvas.height + 30 && p.life > 0.02);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.rot += p.vRot;
      if (p.y > confettiCanvas.height * 0.78) {
        p.life -= 0.02;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (particles.length > 0) {
      animFrameId = requestAnimationFrame(animateConfetti);
    } else {
      animFrameId = null;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // --- Eventos ---
  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);

    document.getElementById("btn-celebrar").addEventListener("click", () => launchConfetti(130));
    document.getElementById("btn-celebrar-footer").addEventListener("click", () => launchConfetti(150));

    // Sobre y carta
    const envelopeClosed = document.getElementById("envelope-closed");
    const letterPaper = document.getElementById("letter-paper");
    const btnOpenLetter = document.getElementById("btn-open-letter");
    const btnCloseLetter = document.getElementById("btn-close-letter");

    btnOpenLetter.addEventListener("click", () => {
      envelopeClosed.hidden = true;
      letterPaper.hidden = false;
      btnOpenLetter.setAttribute("aria-expanded", "true");
      launchConfetti(65);
    });

    btnCloseLetter.addEventListener("click", () => {
      letterPaper.hidden = true;
      envelopeClosed.hidden = false;
      btnOpenLetter.setAttribute("aria-expanded", "false");
    });

    // Razones
    document.getElementById("btn-next-reason").addEventListener("click", () => {
      const cfg = getEffectiveConfig();
      const lista = cfg.razones?.lista || [];
      if (!lista.length) return;
      spotlightIndex = (spotlightIndex + 1) % lista.length;
      document.getElementById("spotlight-index").textContent = `Razón #${spotlightIndex + 1}`;
      document.getElementById("spotlight-text").textContent = applyPlaceholders(
        lista[spotlightIndex],
        cfg.hero
      );
    });

    // Lightbox
    document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
    document.querySelector("[data-close-lightbox]").addEventListener("click", closeLightbox);
    document.getElementById("lightbox-prev").addEventListener("click", () => stepLightbox(-1));
    document.getElementById("lightbox-next").addEventListener("click", () => stepLightbox(1));

    document.addEventListener("keydown", (ev) => {
      const lb = document.getElementById("lightbox");
      if (!lb.hidden) {
        if (ev.key === "Escape") closeLightbox();
        if (ev.key === "ArrowLeft") stepLightbox(-1);
        if (ev.key === "ArrowRight") stepLightbox(1);
      }
    });

    // Panel de personalización
    const drawer = document.getElementById("editor-drawer");
    const openDrawer = () => {
      syncEditorInputs();
      drawer.hidden = false;
      document.body.style.overflow = "hidden";
    };
    const closeDrawer = () => {
      drawer.hidden = true;
      document.body.style.overflow = "";
    };

    document.getElementById("btn-open-editor").addEventListener("click", openDrawer);
    document.getElementById("btn-close-editor").addEventListener("click", closeDrawer);
    document.getElementById("editor-backdrop").addEventListener("click", closeDrawer);

    const fieldBindings = [
      ["ed-nombreElla", "nombreElla"],
      ["ed-apodo", "apodo"],
      ["ed-tuNombre", "tuNombre"],
      ["ed-edad", "edad"],
      ["ed-fechaCumpleanos", "fechaCumpleanos"],
      ["ed-fechaInicio", "fechaInicioRelacion"],
      ["ed-cartaSaludo", "cartaSaludo"],
      ["ed-cartaFirma", "cartaFirma"],
      ["ed-cancionNombre", "cancionNombre"],
      ["ed-cancionArtista", "cancionArtista"],
      ["ed-cancionEnlace", "cancionEnlace"],
    ];

    fieldBindings.forEach(([inputId, key]) => {
      document.getElementById(inputId).addEventListener("input", (ev) => {
        saveOverrides({ ...activeOverrides, [key]: ev.target.value });
        renderAll();
      });
    });

    document.getElementById("ed-cartaParrafos").addEventListener("input", (ev) => {
      const parrafos = ev.target.value
        .split(/\r?\n\s*\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      saveOverrides({ ...activeOverrides, cartaParrafos: parrafos });
      renderAll();
    });

    document.getElementById("ed-razones").addEventListener("input", (ev) => {
      const lista = ev.target.value
        .split(/\r?\n/)
        .map((r) => r.trim())
        .filter(Boolean);
      saveOverrides({ ...activeOverrides, razonesLista: lista });
      renderAll();
    });

    document.getElementById("btn-download-config").addEventListener("click", downloadUpdatedConfig);
    document.getElementById("btn-reset-preview").addEventListener("click", async () => {
      saveOverrides({});
      uploadedPhotoUrls = {};
      await clearSavedPhotos();
      syncEditorInputs();
      renderAll();
    });
  }

  async function init() {
    resizeCanvas();
    uploadedPhotoUrls = await loadAllSavedPhotos();
    bindEvents();
    renderAll();
  }

  init();
})();
