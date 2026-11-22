/* ============================================================
   Kimberrys Cafe & Bakery — site behaviour
   No dependencies. Progressive enhancement only.
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MENU_URL = "https://kimberrys.com/menu";
  const WHATSAPP = "https://wa.me/233241502882";

  /* ---------- Scroll locking ---------- */
  const syncScrollLock = () => {
    document.body.classList.toggle("is-locked", Boolean(document.querySelector("dialog[open]")));
  };
  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("close", syncScrollLock);
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      if (dialog.classList.contains("nav-dialog")) return;
      dialog.close();
    });
  });

  /* ---------- Toast ---------- */
  const toastEl = $("[data-toast]");
  let toastTimer;
  const toast = (message) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("is-visible"), 2800);
  };

  /* ---------- Cookie notice ---------- */
  const cookieBanner = $("[data-cookie-banner]");
  const COOKIE_KEY = "kimberrys-cookie-notice-v1";
  const sizeCookieBanner = () => {
    if (!cookieBanner || cookieBanner.hidden) return;
    document.documentElement.style.setProperty("--cookie-offset", `${cookieBanner.offsetHeight}px`);
  };
  if (cookieBanner) {
    let seen = false;
    try { seen = window.localStorage.getItem(COOKIE_KEY) === "seen"; } catch (error) { seen = false; }
    if (!seen) {
      cookieBanner.hidden = false;
      document.body.classList.add("has-cookie-banner");
      sizeCookieBanner();
      window.addEventListener("resize", sizeCookieBanner, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeCookieBanner);
    }
    $$("[data-cookie-accept]").forEach((button) => {
      button.addEventListener("click", () => {
        try { window.localStorage.setItem(COOKIE_KEY, "seen"); } catch (error) { /* storage may be blocked */ }
        cookieBanner.hidden = true;
        document.body.classList.remove("has-cookie-banner");
        document.documentElement.style.removeProperty("--cookie-offset");
      });
    });
  }

  /* ---------- Sticky header ---------- */
  const header = $("[data-header]");
  const menuTools = $("[data-menu-tools]");
  const tabs = $$(".menu-tab");
  const menuSections = $$("[data-menu-section]");
  const isMenu = document.body.dataset.page === "menu";
  let scrollQueued = false;

  const updateActiveTab = () => {
    if (!tabs.length) return;
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 78;
    const toolsHeight = menuTools ? menuTools.offsetHeight : 0;
    const offset = headerHeight + toolsHeight + 46;
    let current = null;
    menuSections.forEach((section) => {
      if (section.hidden) return;
      if (section.getBoundingClientRect().top <= offset) current = section;
    });
    if (!current) current = menuSections.find((section) => !section.hidden) || null;
    tabs.forEach((tab) => {
      const active = current && tab.getAttribute("href") === `#${current.id}`;
      tab.classList.toggle("is-active", Boolean(active));
      if (active) tab.setAttribute("aria-current", "location");
      else tab.removeAttribute("aria-current");
    });
  };

  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(() => {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
      if (menuTools) menuTools.classList.toggle("is-stuck", window.scrollY > 260);
      updateActiveTab();
      scrollQueued = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Opening hours (Africa/Accra) ---------- */
  const openTextNodes = $$("[data-open-text]");
  const dayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const updateOpenStatus = () => {
    if (!openTextNodes.length) return;
    let parts;
    try {
      parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Accra",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(new Date());
    } catch (error) {
      return;
    }
    const get = (type) => (parts.find((part) => part.type === type) || {}).value;
    const day = dayIndex[get("weekday")] ?? 0;
    const minutes = (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10);
    const open = day !== 0 && minutes >= 480 && minutes < 1200;
    let message;

    if (open) {
      message = "Open now · until 8pm";
    } else if (day === 0) {
      message = "Closed today · opens Monday 8am";
    } else if (minutes < 480) {
      message = "Closed · opens today at 8am";
    } else {
      message = day === 6 ? "Closed · opens Monday at 8am" : "Closed · opens tomorrow at 8am";
    }

    openTextNodes.forEach((node) => { node.textContent = message; });
    $$(".status-dot").forEach((dot) => {
      dot.classList.toggle("status-dot--open", open);
      dot.classList.toggle("status-dot--closed", !open);
    });
  };
  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60000);

  /* ---------- Mobile navigation ---------- */
  const navDialog = $("#nav-dialog");
  const navOpen = $("[data-nav-open]");
  const setNavState = (isOpen) => {
    if (navOpen) navOpen.setAttribute("aria-expanded", String(isOpen));
  };
  if (navOpen && navDialog) {
    navOpen.addEventListener("click", () => {
      navDialog.showModal();
      setNavState(true);
      syncScrollLock();
    });
    navDialog.addEventListener("close", () => setNavState(false));
  }
  $$("[data-nav-close]").forEach((button) => {
    button.addEventListener("click", () => navDialog && navDialog.close());
  });

  /* ---------- Copy / share the menu ---------- */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch (err) { copied = false; }
      field.remove();
      return copied;
    }
  };

  const shareMenu = async () => {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({
          title: "Kimberrys Food Menu",
          text: "The Kimberrys menu — cakes, brunch, wings and comfort food in Osu, Accra.",
          url: MENU_URL
        });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    const copied = await copyText(MENU_URL);
    toast(copied ? "Menu link copied — kimberrys.com/menu" : "Menu link: kimberrys.com/menu");
  };

  $$("[data-share], [data-copy-menu]").forEach((button) => {
    button.addEventListener("click", shareMenu);
  });

  /* ---------- Print ---------- */
  $$("[data-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  /* ---------- Reveal on scroll ---------- */
  if (!reducedMotion && "IntersectionObserver" in window) {
    const targets = $$(
      ".section-head, .fave-card, .menu-preview__intro, .menu-preview__list, " +
      ".gallery__item, .visit__copy, .visit__media, .cta-band__inner, .menu-section__head, " +
      ".cake-panel, .cake-addons, .cake-preorder, .bakery-callout, .share-strip"
    );
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: "0px 0px -30px 0px" });

    targets.forEach((element) => {
      const siblings = Array.from(element.parentElement ? element.parentElement.children : []);
      const index = Math.max(0, siblings.indexOf(element));
      element.style.transitionDelay = `${Math.min(index * 55, 220)}ms`;
      element.classList.add("reveal");
      observer.observe(element);
    });
  }

  /* ---------- Lightbox (home) ---------- */
  const lightbox = $("#lightbox");
  const lightboxImg = $("[data-lightbox-img]");
  const lightboxCaption = $("[data-lightbox-caption]");
  const galleryItems = $$("[data-lightbox]");
  let lightboxIndex = 0;

  const showLightbox = (index) => {
    if (!lightbox || !lightboxImg || !galleryItems.length) return;
    lightboxIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[lightboxIndex];
    lightboxImg.src = item.dataset.full;
    lightboxImg.alt = item.dataset.caption || "";
    if (lightboxCaption) lightboxCaption.textContent = item.dataset.caption || "";
  };

  if (lightbox) {
    galleryItems.forEach((item, index) => {
      item.addEventListener("click", () => {
        showLightbox(index);
        lightbox.showModal();
        syncScrollLock();
      });
    });
    $("[data-lightbox-close]")?.addEventListener("click", () => lightbox.close());
    $("[data-lightbox-prev]")?.addEventListener("click", () => showLightbox(lightboxIndex - 1));
    $("[data-lightbox-next]")?.addEventListener("click", () => showLightbox(lightboxIndex + 1));
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); showLightbox(lightboxIndex - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); showLightbox(lightboxIndex + 1); }
    });
  }

  /* ============================================================
     MENU PAGE
     ============================================================ */
  if (!isMenu) return;

  /* ---------- Search ---------- */
  const searchInput = $("[data-menu-search]");
  const clearSearch = $("[data-clear-search]");
  const resultCount = $("[data-result-count]");
  const emptyState = $("[data-menu-empty]");
  const dishes = $$(".dish");
  const staticSections = $$("[data-menu-static]");
  const dishSections = menuSections.filter((section) => !section.hasAttribute("data-menu-static"));
  const bakery = $("#bakery");
  if (resultCount) resultCount.setAttribute("aria-live", "polite");

  const runSearch = () => {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLowerCase();
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];
    let visible = 0;
    let visibleStatic = 0;

    dishes.forEach((dish) => {
      const section = dish.closest("[data-menu-section]");
      const sectionTitle = section ? section.querySelector("h2")?.textContent || "" : "";
      const description = dish.querySelector(".dish__desc")?.textContent || "";
      const tag = dish.querySelector(".dish__tag")?.textContent || "";
      const haystack = `${dish.dataset.name || ""} ${description} ${tag} ${sectionTitle} ${dish.dataset.section || ""}`.toLowerCase();
      const match = tokens.every((token) => haystack.includes(token));
      dish.hidden = !match;
      if (match) visible += 1;
    });

    dishSections.forEach((section) => {
      section.hidden = !section.querySelector(".dish:not([hidden])");
    });

    staticSections.forEach((section) => {
      const haystack = `${section.dataset.keywords || ""} ${section.textContent || ""}`.toLowerCase();
      const match = !tokens.length || tokens.every((token) => haystack.includes(token));
      section.hidden = !match;
      if (match && tokens.length) visibleStatic += 1;
    });

    if (resultCount) {
      resultCount.hidden = !query;
      const parts = [];
      if (visible) parts.push(`${visible} ${visible === 1 ? "dish" : "dishes"}`);
      if (visibleStatic) parts.push(visibleStatic === 1 ? "cake menu" : "cake menus");
      resultCount.textContent = parts.join(" · ") || "0 dishes";
    }
    if (emptyState) emptyState.hidden = !query || visible !== 0 || visibleStatic !== 0;
    if (clearSearch) clearSearch.hidden = !query;
    if (bakery) bakery.hidden = Boolean(query);
    updateActiveTab();
  };

  if (searchInput) {
    searchInput.addEventListener("input", runSearch);
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && searchInput.value) {
        searchInput.value = "";
        runSearch();
      }
    });
  }
  $$("[data-clear-search]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!searchInput) return;
      searchInput.value = "";
      runSearch();
      searchInput.focus();
    });
  });

  /* ---------- Order builder ---------- */
  const orderDialog = $("#order-dialog");
  const orderList = $("[data-order-list]");
  const orderEmpty = $("[data-order-empty]");
  const orderSummary = $("[data-order-summary]");
  const orderTray = $("[data-order-tray]");
  const orderName = $("[data-order-name]");
  const orderNotes = $("[data-order-notes]");
  const orderError = $("[data-order-error]");
  const orderWebsite = $("[data-order-website]");
  const orderSend = $("[data-order-send]");
  const STORAGE_KEY = "kimberrys-order-v1";

  const dishMap = new Map();
  dishes.forEach((dish) => {
    dishMap.set(dish.dataset.id, {
      id: dish.dataset.id,
      name: dish.dataset.name || "Menu item",
      price: Number(dish.dataset.price) || 0,
      section: dish.dataset.section || ""
    });
  });

  const defaultOrder = { items: {}, name: "", notes: "" };
  let order = defaultOrder;

  const loadOrder = () => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return { ...defaultOrder, items: {} };
      const parsed = JSON.parse(stored);
      const items = {};
      if (parsed && parsed.items && typeof parsed.items === "object") {
        Object.entries(parsed.items).forEach(([id, qty]) => {
          const amount = Math.floor(Number(qty));
          if (dishMap.has(id) && amount > 0) items[id] = amount;
        });
      }
      return {
        items,
        name: typeof parsed?.name === "string" ? parsed.name : "",
        notes: typeof parsed?.notes === "string" ? parsed.notes : ""
      };
    } catch (error) {
      return { ...defaultOrder, items: {} };
    }
  };

  const saveOrder = () => {
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch (error) { /* private mode */ }
  };

  const money = (amount) => `GH₵${Math.round(amount).toLocaleString("en-GH")}`;

  const orderEntries = () => Object.entries(order.items)
    .filter(([id, qty]) => dishMap.has(id) && qty > 0)
    .map(([id, qty]) => ({ ...dishMap.get(id), qty }));

  const orderTotals = () => {
    const entries = orderEntries();
    return {
      entries,
      count: entries.reduce((sum, item) => sum + item.qty, 0),
      total: entries.reduce((sum, item) => sum + item.price * item.qty, 0)
    };
  };

  const buildMessage = () => {
    const { entries, count, total } = orderTotals();
    if (!count) return "Hi Kimberrys! I'd like to place an order.";
    const lines = ["Hi Kimberrys! I'd like to place an order:", ""];
    entries.forEach((item) => {
      lines.push(`${item.qty} × ${item.name} — ${money(item.price * item.qty)}`);
    });
    lines.push("", `Estimated total: ${money(total)}`);
    if (order.name.trim()) lines.push(`Name: ${order.name.trim()}`);
    if (order.notes.trim()) lines.push(`Notes: ${order.notes.trim()}`);
    lines.push("", "Sent from kimberrys.com/menu");
    return lines.join("\n");
  };

  const showOrderError = (message) => {
    if (!orderError) return;
    orderError.textContent = message;
    orderError.hidden = false;
    if (orderName) orderName.setAttribute("aria-invalid", "true");
  };

  const clearOrderError = () => {
    if (orderError) orderError.hidden = true;
    if (orderName) orderName.removeAttribute("aria-invalid");
  };

  const validateOrder = () => {
    if (orderWebsite && orderWebsite.value.trim()) return false;
    const name = orderName ? orderName.value.trim() : "";
    if (orderName && name.length < 2) {
      showOrderError("Please add your name so we know who the order is for.");
      orderName.focus();
      return false;
    }
    clearOrderError();
    return true;
  };

  const renderOrder = () => {
    const { entries, count, total } = orderTotals();
    $$("[data-order-count]").forEach((node) => { node.textContent = String(count); });
    $$("[data-order-total]").forEach((node) => { node.textContent = money(total); });
    if (orderTray) orderTray.hidden = count === 0;

    dishes.forEach((dish) => {
      const amount = order.items[dish.dataset.id] || 0;
      const button = dish.querySelector("[data-add]");
      if (!button) return;
      button.classList.toggle("is-added", amount > 0);
      button.setAttribute(
        "aria-label",
        amount > 0
          ? `Add another ${dish.dataset.name} (${amount} in your order)`
          : `Add ${dish.dataset.name} to your order`
      );
    });

    if (orderList) {
      orderList.replaceChildren();
      entries.forEach((item) => {
        const row = document.createElement("div");
        row.className = "order-item";

        const info = document.createElement("div");
        info.className = "order-item__info";
        const name = document.createElement("p");
        name.className = "order-item__name";
        name.textContent = item.name;
        const unit = document.createElement("p");
        unit.className = "order-item__unit";
        unit.textContent = `${money(item.price)} each`;
        info.append(name, unit);

        const qty = document.createElement("div");
        qty.className = "order-item__qty";
        const minus = document.createElement("button");
        minus.type = "button";
        minus.dataset.orderId = item.id;
        minus.dataset.orderDelta = "-1";
        minus.setAttribute("aria-label", `Remove one ${item.name}`);
        minus.textContent = "−";
        const amount = document.createElement("span");
        amount.textContent = String(item.qty);
        amount.setAttribute("aria-label", `Quantity ${item.qty}`);
        const plus = document.createElement("button");
        plus.type = "button";
        plus.dataset.orderId = item.id;
        plus.dataset.orderDelta = "1";
        plus.setAttribute("aria-label", `Add one more ${item.name}`);
        plus.textContent = "+";
        qty.append(minus, amount, plus);

        const price = document.createElement("p");
        price.className = "order-item__price";
        price.textContent = money(item.price * item.qty);

        row.append(info, qty, price);
        orderList.appendChild(row);
      });
    }

    if (orderEmpty) orderEmpty.hidden = count > 0;
    if (orderSummary) orderSummary.hidden = count === 0;
    if (orderSend) {
      orderSend.href = `${WHATSAPP}?text=${encodeURIComponent(buildMessage())}`;
      orderSend.setAttribute("aria-disabled", String(count === 0));
    }
  };

  const addDish = (id, delta = 1) => {
    if (!dishMap.has(id)) return;
    const next = Math.max(0, (order.items[id] || 0) + delta);
    if (next === 0) delete order.items[id];
    else order.items[id] = next;
    saveOrder();
    renderOrder();
  };

  dishes.forEach((dish) => {
    const button = dish.querySelector("[data-add]");
    if (!button) return;
    button.addEventListener("click", () => {
      addDish(dish.dataset.id, 1);
      const amount = order.items[dish.dataset.id] || 0;
      toast(`${dish.dataset.name} added${amount > 1 ? ` — ${amount} in your order` : ""}`);
    });
  });

  const openOrder = () => {
    if (!orderDialog) return;
    if (orderName) orderName.value = order.name;
    if (orderNotes) orderNotes.value = order.notes;
    clearOrderError();
    renderOrder();
    orderDialog.showModal();
    syncScrollLock();
  };

  $$("[data-open-order]").forEach((button) => button.addEventListener("click", openOrder));
  $$("[data-close-order]").forEach((button) => {
    button.addEventListener("click", () => orderDialog && orderDialog.close());
  });

  orderList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-order-id]");
    if (!button) return;
    addDish(button.dataset.orderId, Number(button.dataset.orderDelta) || 0);
  });

  orderName?.addEventListener("input", () => {
    order.name = orderName.value;
    if (orderName.value.trim().length >= 2) clearOrderError();
    saveOrder();
    if (orderSend) orderSend.href = `${WHATSAPP}?text=${encodeURIComponent(buildMessage())}`;
  });
  orderNotes?.addEventListener("input", () => {
    order.notes = orderNotes.value;
    saveOrder();
    if (orderSend) orderSend.href = `${WHATSAPP}?text=${encodeURIComponent(buildMessage())}`;
  });

  $("[data-clear-order]")?.addEventListener("click", () => {
    order.items = {};
    order.notes = "";
    if (orderNotes) orderNotes.value = "";
    saveOrder();
    renderOrder();
    toast("Your order has been cleared");
  });

  orderSend?.addEventListener("click", (event) => {
    if (orderTotals().count === 0) {
      event.preventDefault();
      toast("Add something from the menu first");
      return;
    }
    if (!validateOrder()) event.preventDefault();
  });

  order = loadOrder();
  if (orderName) orderName.value = order.name;
  if (orderNotes) orderNotes.value = order.notes;
  renderOrder();

  /* ---------- Search results + active tab on first load ---------- */
  if (searchInput && searchInput.value) runSearch();
  updateActiveTab();
  window.addEventListener("load", updateActiveTab, { once: true });
})();
