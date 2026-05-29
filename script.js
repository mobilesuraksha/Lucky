/* ==========================================================
   EarnZone – Main JavaScript
   Handles: User Page + Admin Panel + LocalStorage
   ========================================================== */

// ============================================================
// ===== CHANGE ADMIN CREDENTIALS HERE =====
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
// ============================================================

// ---------- LocalStorage Keys ----------
const LS_APPS     = "earnzone_apps";
const LS_SETTINGS = "earnzone_settings";
const LS_AUTH     = "earnzone_admin_auth";

// ---------- Helpers ----------
function getApps() {
  try { return JSON.parse(localStorage.getItem(LS_APPS)) || []; }
  catch { return []; }
}
function saveApps(apps) {
  localStorage.setItem(LS_APPS, JSON.stringify(apps));
}
function getSettings() {
  try { return JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}; }
  catch { return {}; }
}
function saveSettings(s) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============================================================
//  DETECT PAGE
// ============================================================
const isAdminPage = document.body.classList.contains("admin-body");

if (isAdminPage) {
  initAdminPage();
} else {
  initUserPage();
}

// ============================================================
//  USER PAGE
// ============================================================
function initUserPage() {
  applySettings();
  renderApps();
  initModal();
  initHamburger();
  document.getElementById("footerYear").textContent = new Date().getFullYear();
}

// Apply site settings to header/footer
function applySettings() {
  const s = getSettings();
  const name = s.siteName || "EarnZone";
  const logo = s.logoUrl  || "";

  document.title = name + " – Download Apps & Earn Rewards";

  const headerName = document.getElementById("headerName");
  const headerLogo = document.getElementById("headerLogo");
  const footerName = document.getElementById("footerName");
  const footerSiteName = document.getElementById("footerSiteName");
  const footerLogo = document.getElementById("footerLogo");

  if (headerName) headerName.textContent = name;
  if (footerName) footerName.textContent = name;
  if (footerSiteName) footerSiteName.textContent = name;

  if (headerLogo) {
    if (logo) { headerLogo.src = logo; headerLogo.style.display = "block"; }
    else { headerLogo.src = ""; headerLogo.style.display = "none"; }
  }
  if (footerLogo) {
    if (logo) { footerLogo.src = logo; footerLogo.style.display = "block"; }
    else { footerLogo.src = ""; footerLogo.style.display = "none"; }
  }
}

// Render app cards on user page
function renderApps(filter) {
  const grid       = document.getElementById("appsGrid");
  const emptyState = document.getElementById("emptyState");
  const statApps   = document.getElementById("statApps");
  let   apps       = getApps();

  if (statApps) statApps.textContent = apps.length;

  // Apply category filter
  if (filter && filter !== "all") {
    apps = apps.filter(a => (a.category || "").toLowerCase() === filter.toLowerCase());
  }

  // Build filter buttons
  buildFilterButtons();

  if (!apps.length) {
    if (grid) grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  if (emptyState) emptyState.style.display = "none";
  if (!grid) return;

  grid.innerHTML = apps.map((app, i) => buildAppCard(app, i)).join("");

  // Attach button events
  apps.forEach(app => {
    const dlBtn = document.getElementById("dl-" + app.id);
    const detBtn = document.getElementById("det-" + app.id);
    if (dlBtn) dlBtn.addEventListener("click", () => openLink(app.link));
    if (detBtn) detBtn.addEventListener("click", () => openModal(app));
  });
}

function buildFilterButtons() {
  const bar  = document.getElementById("filterBar");
  if (!bar) return;
  const apps = getApps();
  const cats = [...new Set(apps.map(a => a.category).filter(Boolean))];

  let html = `<button class="filter-btn active" data-filter="all" onclick="filterApps('all',this)">All Apps</button>`;
  cats.forEach(c => {
    html += `<button class="filter-btn" data-filter="${esc(c)}" onclick="filterApps('${esc(c)}',this)">${esc(c)}</button>`;
  });
  bar.innerHTML = html;
}

function filterApps(cat, btn) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderApps(cat);
}

function buildAppCard(app, index) {
  const steps = (app.steps || "").split("\n").filter(s => s.trim());
  const stepsHtml = steps.map(s => `<li>${esc(s)}</li>`).join("");
  const delay = (index % 9) * 0.05;

  return `
  <div class="app-card" style="animation-delay:${delay}s">
    <div class="card-header">
      <div class="card-logo-wrap">
        ${app.logoUrl
          ? `<img src="${esc(app.logoUrl)}" alt="${esc(app.name)}" onerror="this.parentElement.innerHTML='<div class=card-logo-placeholder><i class=fa fa-mobile-screen-button></i></div>'">`
          : `<div class="card-logo-placeholder"><i class="fa fa-mobile-screen-button"></i></div>`}
      </div>
      <div class="card-title-area">
        <div class="card-name">${esc(app.name)}</div>
        <div class="card-category">${esc(app.category || "App")}</div>
      </div>
      <div class="card-reward"><i class="fa fa-coins"></i> ${esc(app.reward)}</div>
    </div>
    <div class="card-body">
      <p class="card-desc">${esc(app.description || "")}</p>
      ${steps.length ? `
        <div class="card-steps-label">Steps</div>
        <ul class="card-steps">${stepsHtml}</ul>
      ` : ""}
      ${app.terms ? `
        <div class="card-terms"><i class="fa fa-circle-info"></i>${esc(app.terms)}</div>
      ` : ""}
    </div>
    <div class="card-footer">
      <button class="btn-download" id="dl-${app.id}">
        <i class="fa fa-download"></i> ${esc(app.btnText || "Download & Earn")}
      </button>
      <button class="btn-details" id="det-${app.id}" title="View Details">
        <i class="fa fa-eye"></i>
      </button>
    </div>
  </div>`;
}

function openLink(url) {
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

// ---------- Modal ----------
function initModal() {
  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("modalClose");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (overlay)  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeModal();
  });
}

function openModal(app) {
  const overlay = document.getElementById("modalOverlay");
  const content = document.getElementById("modalContent");
  if (!overlay || !content) return;

  const steps = (app.steps || "").split("\n").filter(s => s.trim());
  const stepsHtml = steps.map((s, i) => `
    <li><span class="step-bullet">${i + 1}</span>${esc(s)}</li>
  `).join("");

  content.innerHTML = `
    <div class="modal-logo-row">
      <img class="modal-logo" src="${esc(app.logoUrl || "")}" alt="${esc(app.name)}"
        onerror="this.src=''" />
      <div>
        <div class="modal-app-name">${esc(app.name)}</div>
        <div class="modal-category">${esc(app.category || "App")}</div>
      </div>
    </div>
    <div class="modal-reward-badge"><i class="fa fa-coins"></i> Earn ${esc(app.reward)}</div>
    ${app.description ? `
      <div class="modal-label">About this Offer</div>
      <p class="modal-desc">${esc(app.description)}</p>
    ` : ""}
    ${steps.length ? `
      <div class="modal-label">Steps to Complete</div>
      <ul class="modal-steps">${stepsHtml}</ul>
    ` : ""}
    ${app.terms ? `
      <div class="modal-terms"><i class="fa fa-circle-info"></i> ${esc(app.terms)}</div>
    ` : ""}
    <button class="modal-cta" onclick="openLink('${esc(app.link)}')">
      <i class="fa fa-download"></i> ${esc(app.btnText || "Download & Earn")}
    </button>
  `;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

// ---------- Hamburger ----------
function initHamburger() {
  const btn  = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => menu.classList.toggle("open"));
}

function closeMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.remove("open");
}

// Escape HTML to prevent XSS
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================
//  ADMIN PAGE
// ============================================================
function initAdminPage() {
  // Check if already logged in this session
  if (sessionStorage.getItem(LS_AUTH) === "true") {
    showAdminPanel();
  } else {
    document.getElementById("adminLoginOverlay").style.display = "flex";
    document.getElementById("adminPanel").style.display = "none";

    // Allow Enter key on login form
    ["loginUser", "loginPass"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("keydown", e => { if (e.key === "Enter") attemptLogin(); });
    });
  }

  // Logo preview on settings tab
  const logoInput = document.getElementById("settingsLogoUrl");
  if (logoInput) {
    logoInput.addEventListener("input", function() {
      const preview = document.getElementById("settingsLogoPreview");
      if (preview) {
        if (this.value) { preview.src = this.value; preview.style.display = "block"; }
        else { preview.style.display = "none"; }
      }
    });
  }
}

// ---------- Login ----------
function attemptLogin() {
  const user = (document.getElementById("loginUser")?.value || "").trim();
  const pass = (document.getElementById("loginPass")?.value || "").trim();
  const err  = document.getElementById("loginError");

  // ===== CREDENTIALS CHECKED HERE – change ADMIN_USER / ADMIN_PASS at top of file =====
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(LS_AUTH, "true");
    showAdminPanel();
  } else {
    if (err) err.style.display = "block";
    const passEl = document.getElementById("loginPass");
    if (passEl) { passEl.value = ""; passEl.focus(); }
  }
}

function showAdminPanel() {
  const overlay = document.getElementById("adminLoginOverlay");
  const panel   = document.getElementById("adminPanel");
  if (overlay) overlay.style.display = "none";
  if (panel)   panel.style.display   = "flex";

  loadDashboard();
  loadSettingsTab();
  renderManageList();

  // Add sidebar overlay div for mobile
  if (!document.getElementById("sidebarOverlay")) {
    const ov = document.createElement("div");
    ov.className = "sidebar-overlay";
    ov.id = "sidebarOverlay";
    ov.onclick = closeSidebar;
    document.body.appendChild(ov);
  }
}

function adminLogout() {
  sessionStorage.removeItem(LS_AUTH);
  location.reload();
}

// ---------- Sidebar ----------
function toggleSidebar() {
  const sb  = document.getElementById("adminSidebar");
  const ov  = document.getElementById("sidebarOverlay");
  if (!sb) return;
  sb.classList.toggle("open");
  if (ov) ov.classList.toggle("show", sb.classList.contains("open"));
}
function closeSidebar() {
  const sb = document.getElementById("adminSidebar");
  const ov = document.getElementById("sidebarOverlay");
  if (sb) sb.classList.remove("open");
  if (ov) ov.classList.remove("show");
}

// ---------- Tab Switching ----------
function switchTab(tabName, linkEl) {
  // Hide all tabs
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  // Remove active from all nav links
  document.querySelectorAll(".admin-nav-link").forEach(l => l.classList.remove("active"));

  // Show target tab
  const tab = document.getElementById("tab-" + tabName);
  if (tab) tab.classList.add("active");
  if (linkEl) linkEl.classList.add("active");

  // Update topbar title
  const titles = {
    dashboard: "Dashboard",
    "add-app": "Add New App",
    manage:    "Manage Apps",
    settings:  "Site Settings"
  };
  const topbarTitle = document.getElementById("adminTopbarTitle");
  if (topbarTitle) topbarTitle.textContent = titles[tabName] || "Admin";

  // Refresh data for specific tabs
  if (tabName === "dashboard")  loadDashboard();
  if (tabName === "manage")     renderManageList();
  if (tabName === "settings")   loadSettingsTab();
  if (tabName === "add-app") {
    resetAppForm();
    document.getElementById("addAppTitle").textContent = "Add New App";
    document.getElementById("saveAppBtnText").textContent = "Save App";
  }

  closeSidebar();
  return false;
}

// ---------- Dashboard ----------
function loadDashboard() {
  const apps     = getApps();
  const settings = getSettings();

  const totalEl   = document.getElementById("dashTotalApps");
  const catEl     = document.getElementById("dashCategories");
  const rewardEl  = document.getElementById("dashMaxReward");
  const nameEl    = document.getElementById("dashSiteName");
  const recentEl  = document.getElementById("recentAppsList");

  if (totalEl)  totalEl.textContent  = apps.length;
  if (catEl)    catEl.textContent    = [...new Set(apps.map(a => a.category).filter(Boolean))].length;
  if (nameEl)   nameEl.textContent   = settings.siteName || "EarnZone";

  // Max reward (only numeric detection)
  if (rewardEl) {
    const nums = apps.map(a => parseFloat((a.reward || "").replace(/[^0-9.]/g, ""))).filter(n => !isNaN(n));
    rewardEl.textContent = nums.length ? Math.max(...nums) : "—";
  }

  // Recent apps (last 5)
  if (recentEl) {
    const recent = [...apps].reverse().slice(0, 5);
    if (!recent.length) {
      recentEl.innerHTML = `<div class="recent-empty">No apps added yet.</div>`;
    } else {
      recentEl.innerHTML = recent.map(app => `
        <div class="recent-item">
          <img class="recent-item-img" src="${esc(app.logoUrl || "")}" alt="${esc(app.name)}"
            onerror="this.src=''">
          <div class="recent-item-info">
            <div class="recent-item-name">${esc(app.name)}</div>
            <div class="recent-item-cat">${esc(app.category || "—")}</div>
          </div>
          <div class="recent-item-reward">${esc(app.reward)}</div>
        </div>
      `).join("");
    }
  }
}

// ---------- App Form ----------
function saveApp() {
  const id      = document.getElementById("editingId")?.value || "";
  const name    = document.getElementById("appName")?.value.trim();
  const logoUrl = document.getElementById("appLogo")?.value.trim();
  const category= document.getElementById("appCategory")?.value.trim();
  const reward  = document.getElementById("appReward")?.value.trim();
  const desc    = document.getElementById("appDesc")?.value.trim();
  const steps   = document.getElementById("appSteps")?.value.trim();
  const link    = document.getElementById("appLink")?.value.trim();
  const btnText = document.getElementById("appBtnText")?.value.trim();
  const terms   = document.getElementById("appTerms")?.value.trim();

  // Validation
  if (!name)     return showToast("App name is required.", "error");
  if (!logoUrl)  return showToast("App logo URL is required.", "error");
  if (!category) return showToast("Category is required.", "error");
  if (!reward)   return showToast("Reward amount is required.", "error");
  if (!desc)     return showToast("Description is required.", "error");
  if (!steps)    return showToast("Steps are required.", "error");
  if (!link)     return showToast("Affiliate link is required.", "error");

  const apps = getApps();

  if (id) {
    // Edit existing
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) {
      apps[idx] = { ...apps[idx], name, logoUrl, category, reward, description: desc, steps, link, btnText: btnText || "Download & Earn", terms };
      saveApps(apps);
      showToast("App updated successfully!", "success");
    }
  } else {
    // Add new
    const newApp = {
      id: genId(), name, logoUrl, category, reward,
      description: desc, steps, link,
      btnText: btnText || "Download & Earn",
      terms,
      createdAt: Date.now()
    };
    apps.push(newApp);
    saveApps(apps);
    showToast("App added successfully!", "success");
  }

  resetAppForm();
  switchTab("manage", document.querySelector('[data-tab="manage"]'));
}

function resetAppForm() {
  const ids = ["editingId","appName","appLogo","appCategory","appReward","appDesc","appSteps","appLink","appBtnText","appTerms"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const titleEl = document.getElementById("addAppTitle");
  const btnEl   = document.getElementById("saveAppBtnText");
  if (titleEl) titleEl.textContent = "Add New App";
  if (btnEl)   btnEl.textContent   = "Save App";
}

function editApp(appId) {
  const apps = getApps();
  const app  = apps.find(a => a.id === appId);
  if (!app) return;

  document.getElementById("editingId").value    = app.id;
  document.getElementById("appName").value      = app.name || "";
  document.getElementById("appLogo").value      = app.logoUrl || "";
  document.getElementById("appCategory").value  = app.category || "";
  document.getElementById("appReward").value    = app.reward || "";
  document.getElementById("appDesc").value      = app.description || "";
  document.getElementById("appSteps").value     = app.steps || "";
  document.getElementById("appLink").value      = app.link || "";
  document.getElementById("appBtnText").value   = app.btnText || "";
  document.getElementById("appTerms").value     = app.terms || "";

  document.getElementById("addAppTitle").textContent    = "Edit App";
  document.getElementById("saveAppBtnText").textContent = "Update App";

  switchTab("add-app", document.querySelector('[data-tab="add-app"]'));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteApp(appId) {
  if (!confirm("Are you sure you want to delete this app offer?")) return;
  let apps = getApps();
  apps = apps.filter(a => a.id !== appId);
  saveApps(apps);
  showToast("App deleted.", "success");
  renderManageList();
  loadDashboard();
}

// ---------- Manage List ----------
function renderManageList() {
  const list     = document.getElementById("manageList");
  const countEl  = document.getElementById("manageCount");
  const searchEl = document.getElementById("manageSearch");
  if (!list) return;

  let apps = getApps();
  const q  = (searchEl?.value || "").toLowerCase().trim();

  if (q) {
    apps = apps.filter(a =>
      (a.name || "").toLowerCase().includes(q) ||
      (a.category || "").toLowerCase().includes(q) ||
      (a.reward || "").toLowerCase().includes(q)
    );
  }

  if (countEl) countEl.textContent = apps.length + " app" + (apps.length !== 1 ? "s" : "");

  if (!apps.length) {
    list.innerHTML = `<div class="manage-empty">${q ? "No apps match your search." : "No apps added yet. Go to <strong>Add App</strong> to get started."}</div>`;
    return;
  }

  list.innerHTML = apps.map(app => `
    <div class="manage-item" id="mi-${app.id}">
      <img class="manage-item-img" src="${esc(app.logoUrl || "")}" alt="${esc(app.name)}"
        onerror="this.src=''">
      <div class="manage-item-info">
        <div class="manage-item-name">${esc(app.name)}</div>
        <div class="manage-item-meta">${esc(app.category || "—")} &bull; <span class="manage-item-reward">${esc(app.reward)}</span></div>
      </div>
      <div class="manage-actions">
        <button class="btn-icon edit" title="Edit" onclick="editApp('${app.id}')"><i class="fa fa-pen"></i></button>
        <button class="btn-icon del"  title="Delete" onclick="deleteApp('${app.id}')"><i class="fa fa-trash"></i></button>
      </div>
    </div>
  `).join("");
}

// ---------- Settings ----------
function loadSettingsTab() {
  const s = getSettings();
  const nameEl  = document.getElementById("settingsSiteName");
  const logoEl  = document.getElementById("settingsLogoUrl");
  const preview = document.getElementById("settingsLogoPreview");

  if (nameEl) nameEl.value = s.siteName || "";
  if (logoEl) logoEl.value = s.logoUrl  || "";
  if (preview) {
    if (s.logoUrl) { preview.src = s.logoUrl; preview.style.display = "block"; }
    else preview.style.display = "none";
  }
}

function saveSettings() {
  const name = document.getElementById("settingsSiteName")?.value.trim() || "EarnZone";
  const logo = document.getElementById("settingsLogoUrl")?.value.trim()  || "";

  saveSettings_data({ siteName: name, logoUrl: logo });
  showToast("Settings saved successfully!", "success");

  // Update dashboard site name label
  const dashName = document.getElementById("dashSiteName");
  if (dashName) dashName.textContent = name;

  // Update page title
  document.title = name + " – Admin Panel";
}

// Avoid name collision with outer saveSettings function
function saveSettings_data(obj) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(obj));
}
// Override the earlier function
(function() {
  const original = window.saveSettings;
  window.saveSettings = function() {
    const name = document.getElementById("settingsSiteName")?.value.trim() || "EarnZone";
    const logo = document.getElementById("settingsLogoUrl")?.value.trim()  || "";
    localStorage.setItem(LS_SETTINGS, JSON.stringify({ siteName: name, logoUrl: logo }));
    showToast("Settings saved successfully!", "success");
    const dashName = document.getElementById("dashSiteName");
    if (dashName) dashName.textContent = name;
    document.title = name + " – Admin Panel";

    const preview = document.getElementById("settingsLogoPreview");
    if (preview) {
      if (logo) { preview.src = logo; preview.style.display = "block"; }
      else preview.style.display = "none";
    }
  };
})();

// ---------- Clear All Data ----------
function clearAllData() {
  if (!confirm("This will DELETE all apps and reset site settings. Are you absolutely sure?")) return;
  if (!confirm("Last warning: All data will be permanently removed. Continue?")) return;
  localStorage.removeItem(LS_APPS);
  localStorage.removeItem(LS_SETTINGS);
  showToast("All data cleared.", "success");
  loadDashboard();
  renderManageList();
  loadSettingsTab();
}

// ---------- Toast Notification ----------
function showToast(msg, type) {
  const toast = document.getElementById("adminToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = "admin-toast show " + (type || "");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.className = "admin-toast";
  }, 3000);
}
