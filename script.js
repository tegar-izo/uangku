// --- Data & State ---
const STORAGE_KEYS = {
    transactions: "uangku_data",
    wallets: "uangku_wallets",
    activeWallet: "uangku_active_wallet"
};

const DEFAULT_WALLET = { id: "dompet-utama", name: "Dompet Utama" };

// Daftar dompet tempat aset disimpan
let wallets = JSON.parse(localStorage.getItem(STORAGE_KEYS.wallets)) || [];
if (!Array.isArray(wallets) || wallets.length === 0) {
    wallets = [{ ...DEFAULT_WALLET }];
}

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions)) || [];
if (!Array.isArray(transactions)) transactions = [];

// Transaksi lama (sebelum ada dompet) otomatis masuk ke dompet pertama
let needsMigration = false;
transactions.forEach(item => {
    if (!wallets.some(wallet => wallet.id === item.walletId)) {
        item.walletId = wallets[0].id;
        needsMigration = true;
    }
});

let activeWalletId = localStorage.getItem(STORAGE_KEYS.activeWallet);
if (!wallets.some(wallet => wallet.id === activeWalletId)) {
    activeWalletId = wallets[0].id;
}

let currentType = "masuk";

// Filter riwayat: dompet & tanggal ("all" = tanpa filter)
let historyFilter = { walletId: "all", date: "all" };

// --- Elemen DOM ---
const themeLink = document.getElementById("theme-link");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeText = document.getElementById("theme-text");

const popupOverlay = document.getElementById("popup-overlay");
const menuOverlay = document.getElementById("menu-overlay");
const modalHeader = document.getElementById("modal-header");
const inputValue = document.getElementById("input-value");
const historyList = document.getElementById("history-list");
const sisaSaldo = document.getElementById("sisa-saldo");
const flowIn = document.getElementById("flow-in");
const flowOut = document.getElementById("flow-out");
const walletStrip = document.getElementById("wallet-strip");
const walletAdd = document.getElementById("wallet-add");
const walletOverlay = document.getElementById("wallet-overlay");
const walletModalHeader = document.getElementById("wallet-modal-header");
const inputWalletName = document.getElementById("input-wallet-name");
const deleteWalletOverlay = document.getElementById("delete-wallet-overlay");
const deleteWalletInfo = document.getElementById("delete-wallet-info");
const moveWalletLabel = document.getElementById("move-wallet-label");
const moveWalletTarget = document.getElementById("move-wallet-target");
const transferOverlay = document.getElementById("transfer-overlay");
const transferFrom = document.getElementById("transfer-from");
const transferTo = document.getElementById("transfer-to");
const inputTransferAmount = document.getElementById("transfer-amount");
const inputTransferNote = document.getElementById("transfer-note");
const filterOverlay = document.getElementById("filter-overlay");
const filterWallet = document.getElementById("filter-wallet");
const filterDate = document.getElementById("filter-date");
const filterLabel = document.getElementById("filter-label");
const filterButton = document.getElementById("open-filter");

// --- LOGIKA TEMA (BARU) ---

// 1. Fungsi untuk set tema
function applyTheme(theme) {
    if (theme === "dark") {
        themeLink.setAttribute("href", "theme-dark.css");
        themeIcon.innerText = "light_mode"; // Ikon berubah jadi matahari saat gelap
        themeText.innerText = "Mode Terang";
    } else {
        themeLink.setAttribute("href", "theme.css");
        themeIcon.innerText = "dark_mode"; // Ikon berubah jadi bulan saat terang
        themeText.innerText = "Mode Gelap";
    }
    localStorage.setItem("selected_theme", theme);
}

// 2. Cek tema saat aplikasi pertama dimuat
const savedTheme = localStorage.getItem("selected_theme") || "light";
applyTheme(savedTheme);

// 3. Event Listener Klik Tombol Tema
themeToggle.addEventListener("click", () => {
    const currentTheme = localStorage.getItem("selected_theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    closeOverlay(menuOverlay, ".menu-window"); // Menutup dengan animasi GSAP
});

// --- LOGIKA DOMPET ---

function formatRupiah(value) {
    return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function getDateLabel(date) {
    if (!date) return "Tanpa tanggal";

    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    if (date === today) return `Hari ini · ${date}`;
    if (date === yesterday) return `Kemarin · ${date}`;
    return date;
}

function getWalletName(walletId) {
    const wallet = wallets.find(item => item.id === walletId);
    return wallet ? wallet.name : "Dompet terhapus";
}

// Format ribuan saat nominal diketik (tanpa desimal, pemisah titik)
function formatAmountValue(value) {
    const digits = String(value)
        .replace(/\D/g, "")
        .replace(/^0+(?=\d)/, "");

    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseAmount(value) {
    const digits = String(value).replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : NaN;
}

function formatAmountInput(input) {
    const raw = input.value;
    const caret =
        typeof input.selectionStart === "number"
            ? input.selectionStart
            : raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
    const formatted = formatAmountValue(raw);

    if (formatted === raw) return;

    input.value = formatted;

    if (typeof input.setSelectionRange !== "function") return;

    // Kembalikan kursor setelah jumlah digit yang sama
    let position = 0;
    let seen = 0;
    while (position < formatted.length && seen < digitsBeforeCaret) {
        if (/\d/.test(formatted[position])) seen++;
        position++;
    }
    input.setSelectionRange(position, position);
}

function saveWallets() {
    localStorage.setItem(STORAGE_KEYS.wallets, JSON.stringify(wallets));
    localStorage.setItem(STORAGE_KEYS.activeWallet, activeWalletId);
}

function getActiveWallet() {
    return wallets.find(wallet => wallet.id === activeWalletId) || wallets[0];
}

function getWalletBalance(walletId) {
    return transactions.reduce((total, item) => {
        if (item.walletId !== walletId) return total;
        const amount = Number(item.amount) || 0;
        return item.type === "masuk" ? total + amount : total - amount;
    }, 0);
}

function selectWallet(walletId) {
    activeWalletId = walletId;
    saveWallets();
    saveAndRender();
}

function renderWallets() {
    walletStrip.innerHTML = wallets
        .map(
            wallet => `
            <button
                class="wallet-chip ${wallet.id === activeWalletId ? "active" : ""}"
                data-wallet-id="${escapeHtml(wallet.id)}"
                aria-pressed="${wallet.id === activeWalletId}"
            >
                <span class="wallet-name">${escapeHtml(wallet.name)}</span>
                <span class="wallet-balance">${formatRupiah(getWalletBalance(wallet.id))}</span>
            </button>
        `
        )
        .join("");

    walletStrip.querySelectorAll(".wallet-chip").forEach(chip => {
        chip.addEventListener("click", () => selectWallet(chip.dataset.walletId));
    });
}

let walletFormMode = "create";

function openWalletModal(mode = "create") {
    walletFormMode = mode;
    const isRename = mode === "rename";

    walletModalHeader.innerText = isRename
        ? "Ganti Nama Dompet"
        : "Tambah Dompet Baru";
    inputWalletName.value = isRename ? getActiveWallet().name : "";

    openOverlay(walletOverlay, ".modal");
    setTimeout(() => inputWalletName.focus(), 250);
}

function submitWallet() {
    const name = inputWalletName.value.trim();
    if (!name) return alert("Nama dompet tidak boleh kosong!");

    if (walletFormMode === "rename") {
        const wallet = wallets.find(w => w.id === activeWalletId);
        if (!wallet) return;

        wallet.name = name;
        saveWallets();
        closeOverlay(walletOverlay, ".modal");
        saveAndRender();
        return;
    }

    const wallet = { id: `dompet-${Date.now()}`, name };
    wallets.push(wallet);
    activeWalletId = wallet.id;

    saveWallets();
    closeOverlay(walletOverlay, ".modal");
    saveAndRender();
}

// --- HAPUS DOMPET ---

function openDeleteWalletModal() {
    if (wallets.length <= 1) {
        return alert(
            "Minimal harus ada satu dompet. Tambah dompet lain dulu sebelum menghapus."
        );
    }

    const wallet = getActiveWallet();
    const count = transactions.filter(item => item.walletId === wallet.id).length;
    const targets = wallets.filter(w => w.id !== wallet.id);
    const hasTransactions = count > 0;

    deleteWalletInfo.innerText = hasTransactions
        ? `Dompet "${wallet.name}" berisi ${count} transaksi. Transaksinya akan dipindahkan ke dompet yang Anda pilih.`
        : `Dompet "${wallet.name}" tidak memiliki transaksi dan akan dihapus.`;

    moveWalletLabel.style.display = hasTransactions ? "" : "none";
    moveWalletTarget.style.display = hasTransactions ? "" : "none";
    moveWalletTarget.innerHTML = targets
        .map(
            target =>
                `<option value="${escapeHtml(target.id)}">${escapeHtml(target.name)}</option>`
        )
        .join("");

    openOverlay(deleteWalletOverlay, ".modal");
}

function confirmDeleteWallet() {
    if (wallets.length <= 1) {
        closeOverlay(deleteWalletOverlay, ".modal");
        return;
    }

    const wallet = getActiveWallet();
    const remaining = wallets.filter(w => w.id !== wallet.id);
    const hasTransactions = transactions.some(
        item => item.walletId === wallet.id
    );
    const targetId = hasTransactions
        ? moveWalletTarget.value || remaining[0].id
        : null;

    if (hasTransactions) {
        if (!remaining.some(w => w.id === targetId)) {
            return alert("Pilih dompet tujuan yang valid.");
        }

        // Transaksi tidak ikut terhapus, hanya dipindahkan ke dompet tujuan
        transactions.forEach(item => {
            if (item.walletId === wallet.id) item.walletId = targetId;
        });
    }

    wallets = remaining;
    activeWalletId = hasTransactions ? targetId : remaining[0].id;

    // Jangan biarkan filter menunjuk dompet yang sudah dihapus
    if (historyFilter.walletId === wallet.id) {
        historyFilter.walletId = "all";
    }

    saveWallets();
    closeOverlay(deleteWalletOverlay, ".modal");
    saveAndRender();
}

// --- TRANSFER ANTAR DOMPET ---

let previousTransferFrom = "";
let previousTransferTo = "";

function fillWalletOptions(select, walletList, selectedId) {
    select.innerHTML = walletList
        .map(
            wallet =>
                `<option value="${escapeHtml(wallet.id)}">${escapeHtml(wallet.name)}</option>`
        )
        .join("");
    select.value = selectedId;
}

// Tiap dropdown hanya memuat dompet yang belum dipakai di sisi lain
function refreshTransferOptions() {
    const fromId = transferFrom.value;
    const toId = transferTo.value;

    fillWalletOptions(
        transferFrom,
        wallets.filter(wallet => wallet.id !== toId),
        fromId
    );
    fillWalletOptions(
        transferTo,
        wallets.filter(wallet => wallet.id !== fromId),
        toId
    );
}

function handleTransferWalletChange(side) {
    if (transferFrom.value === transferTo.value) {
        // Kembalikan sisi lainnya ke dompet yang tadi dipakai
        if (side === "from") {
            transferTo.value = previousTransferFrom;
        } else {
            transferFrom.value = previousTransferTo;
        }
    }

    previousTransferFrom = transferFrom.value;
    previousTransferTo = transferTo.value;
    refreshTransferOptions();
}

function swapTransferWallets() {
    const fromId = transferFrom.value;
    const toId = transferTo.value;

    // Isi ulang dengan semua dompet dulu: nilai hasil tukar belum tentu ada
    // di daftar yang sedang terfilter, dan <select> akan kosong jika begitu.
    fillWalletOptions(transferFrom, wallets, toId);
    fillWalletOptions(transferTo, wallets, fromId);

    previousTransferFrom = transferFrom.value;
    previousTransferTo = transferTo.value;
    refreshTransferOptions();
}

function openTransferModal() {
    if (wallets.length < 2) {
        return alert(
            "Butuh minimal dua dompet untuk melakukan transfer. Tambah dompet lain dulu."
        );
    }

    const targetWallet =
        wallets.find(wallet => wallet.id !== activeWalletId) || wallets[1];

    previousTransferFrom = activeWalletId;
    previousTransferTo = targetWallet.id;

    fillWalletOptions(transferFrom, wallets, activeWalletId);
    fillWalletOptions(transferTo, wallets, targetWallet.id);
    refreshTransferOptions();

    inputTransferAmount.value = "";
    inputTransferNote.value = "";

    openOverlay(transferOverlay, ".modal");
}

function saveTransfer() {
    const amount = parseAmount(inputTransferAmount.value);
    const fromWallet = wallets.find(wallet => wallet.id === transferFrom.value);
    const toWallet = wallets.find(wallet => wallet.id === transferTo.value);

    if (!amount || amount <= 0) {
        return alert("Masukkan jumlah transfer yang valid!");
    }
    if (!fromWallet || !toWallet || fromWallet.id === toWallet.id) {
        return alert("Pilih dua dompet yang berbeda.");
    }

    // Dua transaksi ber-`transferId` sama: keluar dari sumber, masuk ke tujuan.
    // Saldo total tetap, hanya berpindah dompet.
    const stamp = Date.now();
    const transferId = `transfer-${stamp}`;
    const note = inputTransferNote.value.trim();
    const date = new Date().toLocaleDateString();

    transactions.unshift(
        {
            id: stamp,
            type: "keluar",
            amount,
            description: note || `Transfer ke ${toWallet.name}`,
            date,
            walletId: fromWallet.id,
            transferId,
            transfer: true
        },
        {
            id: stamp + 1,
            type: "masuk",
            amount,
            description: note || `Transfer dari ${fromWallet.name}`,
            date,
            walletId: toWallet.id,
            transferId,
            transfer: true
        }
    );

    saveAndRender();
    closeOverlay(transferOverlay, ".modal");
}

document.getElementById("transfer").addEventListener("click", () => {
    closeOverlay(menuOverlay, ".menu-window");
    openTransferModal();
});

document.getElementById("save-transfer").addEventListener("click", saveTransfer);

transferOverlay.addEventListener("click", e => {
    if (e.target === transferOverlay) closeOverlay(transferOverlay, ".modal");
});

transferFrom.addEventListener("change", () =>
    handleTransferWalletChange("from")
);
transferTo.addEventListener("change", () => handleTransferWalletChange("to"));

document
    .getElementById("swap-transfer")
    .addEventListener("click", swapTransferWallets);

// Format ribuan untuk nominal transfer
inputTransferAmount.addEventListener("input", () =>
    formatAmountInput(inputTransferAmount)
);

// Tombol transfer cepat di layar utama
document
    .getElementById("transfer-quick")
    .addEventListener("click", openTransferModal);

// Tutup sheet aktif dengan tombol Escape
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;

    [
        popupOverlay,
        walletOverlay,
        deleteWalletOverlay,
        transferOverlay,
        filterOverlay
    ].forEach(
        overlay => {
            if (overlay.style.display === "flex") {
                closeOverlay(overlay, ".modal");
            }
        }
    );

    if (menuOverlay.style.display === "flex") {
        closeOverlay(menuOverlay, ".menu-window");
    }
});

// --- FILTER RIWAYAT ---

function renderFilterState() {
    const isFiltered =
        historyFilter.walletId !== "all" || historyFilter.date !== "all";

    filterButton.classList.toggle("active", isFiltered);

    if (!isFiltered) {
        filterLabel.innerText = "semua";
        return;
    }

    const parts = [];
    if (historyFilter.walletId !== "all") {
        parts.push(getWalletName(historyFilter.walletId));
    }
    if (historyFilter.date !== "all") {
        parts.push(getDateLabel(historyFilter.date));
    }

    filterLabel.innerText = parts.join(" · ");
}

function openFilterModal() {
    filterWallet.innerHTML = [
        `<option value="all">Semua dompet</option>`,
        ...wallets.map(
            wallet =>
                `<option value="${escapeHtml(wallet.id)}">${escapeHtml(wallet.name)}</option>`
        )
    ].join("");
    filterWallet.value = historyFilter.walletId;

    const dates = [];
    transactions.forEach(item => {
        const date = item.date || "";
        if (!dates.includes(date)) dates.push(date);
    });

    filterDate.innerHTML = [
        `<option value="all">Semua tanggal</option>`,
        ...dates.map(
            date =>
                `<option value="${escapeHtml(date)}">${escapeHtml(getDateLabel(date))}</option>`
        )
    ].join("");
    filterDate.value = historyFilter.date;

    openOverlay(filterOverlay, ".modal");
}

function applyHistoryFilter() {
    historyFilter.walletId = filterWallet.value || "all";
    historyFilter.date = filterDate.value || "all";

    closeOverlay(filterOverlay, ".modal");
    saveAndRender();
}

function resetHistoryFilter() {
    historyFilter = { walletId: "all", date: "all" };

    closeOverlay(filterOverlay, ".modal");
    saveAndRender();
}

filterButton.addEventListener("click", openFilterModal);
document
    .getElementById("apply-filter")
    .addEventListener("click", applyHistoryFilter);
document
    .getElementById("reset-filter")
    .addEventListener("click", resetHistoryFilter);

filterOverlay.addEventListener("click", e => {
    if (e.target === filterOverlay) closeOverlay(filterOverlay, ".modal");
});

walletAdd.addEventListener("click", () => openWalletModal("create"));

document.getElementById("add-wallet").addEventListener("click", () => {
    closeOverlay(menuOverlay, ".menu-window");
    openWalletModal("create");
});

document.getElementById("rename-wallet").addEventListener("click", () => {
    closeOverlay(menuOverlay, ".menu-window");
    openWalletModal("rename");
});

document.getElementById("delete-wallet").addEventListener("click", () => {
    closeOverlay(menuOverlay, ".menu-window");
    openDeleteWalletModal();
});

document.getElementById("save-wallet").addEventListener("click", submitWallet);

inputWalletName.addEventListener("keydown", e => {
    if (e.key === "Enter") submitWallet();
});

walletOverlay.addEventListener("click", e => {
    if (e.target === walletOverlay) closeOverlay(walletOverlay, ".modal");
});

deleteWalletOverlay.addEventListener("click", e => {
    if (e.target === deleteWalletOverlay)
        closeOverlay(deleteWalletOverlay, ".modal");
});

// --- LOGIKA ANIMASI GSAP (Helper Functions) ---

function prefersReducedMotion() {
    return (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

// Fungsi untuk membuka overlay
function openOverlay(overlay, contentSelector) {
    const content = overlay.querySelector(contentSelector);

    overlay.style.display = "flex";

    // Hormati permintaan gerak minimal: tampilkan tanpa animasi
    if (prefersReducedMotion()) {
        gsap.set(overlay, { opacity: 1 });
        gsap.set(content, { opacity: 1, scale: 1, y: 0 });
        return;
    }

    // Siapkan kondisi awal (gaib)
    gsap.set(overlay, { opacity: 0 });
    gsap.set(content, { scale: 0.8, y: 30, opacity: 0 });

    // Jalankan animasi masuk
    gsap.to(overlay, { opacity: 1, duration: 0.3 });
    gsap.to(content, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
    });
}

// Fungsi untuk menutup overlay
function closeOverlay(overlay, contentSelector) {
    const content = overlay.querySelector(contentSelector);

    if (prefersReducedMotion()) {
        overlay.style.display = "none";
        return;
    }

    // Jalankan animasi keluar
    gsap.to(content, {
        opacity: 0,
        scale: 0.8,
        y: 30,
        duration: 0.3,
        ease: "power2.in"
    });

    gsap.to(overlay, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            overlay.style.display = "none"; // Baru di-hide setelah animasi selesai
        }
    });
}

// --- LOGIKA TRANSAKSI ---

function showPopUp(type) {
    currentType = type;
    // Buka dengan animasi GSAP
    openOverlay(popupOverlay, ".modal");

    modalHeader.innerText =
        type === "masuk" ? "Tambah Pemasukan" : "Catat Pengeluaran";
    document.getElementById("input-value").value = "";
    document.getElementById("input-desc").value = "";
}

document
    .getElementById("masuk")
    .addEventListener("click", () => showPopUp("masuk"));
document
    .getElementById("keluar")
    .addEventListener("click", () => showPopUp("keluar"));
document
    .getElementById("setting")
    .addEventListener("click", () => openOverlay(menuOverlay, ".menu-window"));

// Menutup overlay saat klik area luar
popupOverlay.addEventListener("click", e => {
    if (e.target === popupOverlay) closeOverlay(popupOverlay, ".modal");
});

menuOverlay.addEventListener("click", e => {
    if (e.target === menuOverlay) closeOverlay(menuOverlay, ".menu-window");
});

document.getElementById("save-value").addEventListener("click", () => {
    const value = parseAmount(inputValue.value);
    const desc =
        document.getElementById("input-desc").value || "Tanpa keterangan";

    if (!value || value <= 0) return alert("Masukkan jumlah yang valid!");

    const newTransaction = {
        id: Date.now(),
        type: currentType,
        amount: value,
        description: desc,
        date: new Date().toLocaleDateString(),
        walletId: activeWalletId
    };

    transactions.unshift(newTransaction);
    saveAndRender();
    // Tutup dengan animasi GSAP
    closeOverlay(popupOverlay, ".modal");
});

// Tampilkan pemisah ribuan sambil mengetik
inputValue.addEventListener("input", () => formatAmountInput(inputValue));

// Escape teks sebelum disisipkan ke HTML (mencegah XSS dari data import)
function escapeHtml(value) {
    return String(value).replace(
        /[&<>"']/g,
        char =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]
    );
}

function saveAndRender() {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
    saveWallets();

    // Saldo & arus kas di header mencakup seluruh dompet
    let total = 0;
    let income = 0;
    let expense = 0;

    transactions.forEach(item => {
        const amount = Number(item.amount) || 0;
        if (item.type === "masuk") {
            total += amount;
            income += amount;
        } else {
            total -= amount;
            expense += amount;
        }
    });

    // Riwayat menampilkan semua dompet, lalu disaring oleh filter yang aktif
    if (
        historyFilter.walletId !== "all" &&
        !wallets.some(wallet => wallet.id === historyFilter.walletId)
    ) {
        historyFilter.walletId = "all";
    }

    // Kelompokkan transaksi per tanggal, urut sesuai kemunculan (terbaru dulu)
    const groups = [];
    const groupByDate = new Map();

    transactions
        .filter(item => {
            if (
                historyFilter.walletId !== "all" &&
                item.walletId !== historyFilter.walletId
            ) {
                return false;
            }
            if (
                historyFilter.date !== "all" &&
                (item.date || "") !== historyFilter.date
            ) {
                return false;
            }
            return true;
        })
        .forEach(item => {
            // Normalisasi tipe agar tidak bisa dipakai menyisipkan atribut HTML
            const type = item.type === "masuk" ? "masuk" : "keluar";
            const amount = Number(item.amount) || 0;

            const dateKey = item.date || "";
            let group = groupByDate.get(dateKey);
            if (!group) {
                group = { date: dateKey, rows: [] };
                groupByDate.set(dateKey, group);
                groups.push(group);
            }

            group.rows.push(`
            <div class="history-item ${type}${item.transfer ? " transfer" : ""}">
                <div class="history-icon">
                    <span class="material-symbols-rounded">${item.transfer ? "swap_horiz" : type === "masuk" ? "arrow_circle_down" : "arrow_circle_up"}</span>
                </div>
                <div class="keterangan">
                    <p>${escapeHtml(item.description || "Tanpa keterangan")}</p>
                    <small>${escapeHtml(getWalletName(item.walletId))}</small>
                </div>
                <span class="history-value">${type === "masuk" ? "+" : "-"}${amount.toLocaleString("id-ID")}</span>
            </div>
        `);
        });

    const groupsHtml = groups
        .map(
            group => `
            <section class="history-group">
                <div class="history-day">${escapeHtml(getDateLabel(group.date))}</div>
                ${group.rows.join("")}
            </section>
        `
        )
        .join("");

    const isFiltered =
        historyFilter.walletId !== "all" || historyFilter.date !== "all";

    // Satu kali tulis ke DOM, bukan innerHTML += di dalam loop
    historyList.innerHTML = groups.length
        ? groupsHtml
        : `
            <div class="empty-state">
                <span class="material-symbols-rounded">${isFiltered ? "filter_list_off" : "savings"}</span>
                <p>${isFiltered ? "Tidak ada transaksi untuk filter ini." : "Belum ada transaksi."}</p>
                <small>${isFiltered ? "Coba ubah atau reset filternya." : 'Tekan "masuk" atau "keluar" untuk mulai mencatat.'}</small>
            </div>
        `;

    sisaSaldo.innerText = formatRupiah(total);
    flowIn.innerText = formatRupiah(income);
    flowOut.innerText = formatRupiah(expense);

    renderFilterState();
    renderWallets();
}

// --- LOGIKA EXPORT & IMPORT ---

// 1. Mengambil elemen tombol dari HTML
const exportBtn = document.querySelector(".menu-button.export");
const importBtn = document.querySelector(".menu-button.import");

// Backup lengkap: transaksi + daftar dompet beserta namanya
function buildBackup() {
    return {
        app: "uangku",
        version: 2,
        exportedAt: new Date().toISOString(),
        wallets: wallets.map(wallet => ({ id: wallet.id, name: wallet.name })),
        transactions: transactions
    };
}

// 2. Logika untuk EXPORT (Mengunduh Data)
exportBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(buildBackup(), null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "uangku_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Tutup dengan animasi GSAP
    closeOverlay(menuOverlay, ".menu-window");
    alert("Data berhasil diekspor!");
});

// --- LOGIKA IMPORT (VERSI STABIL MOBILE) ---

const fileInputHidden = document.getElementById("file-input-hidden");

// Validasi & rapikan daftar dompet dari file backup
function normalizeWallets(rawWallets) {
    if (!Array.isArray(rawWallets)) return [];

    const seen = new Set();
    const cleaned = [];

    rawWallets.forEach(item => {
        if (!item || typeof item !== "object") return;

        const id =
            typeof item.id === "string" && item.id.trim()
                ? item.id.trim()
                : `dompet-${cleaned.length + 1}`;
        const name =
            typeof item.name === "string" ? item.name.trim().slice(0, 24) : "";

        if (seen.has(id)) return;
        seen.add(id);
        cleaned.push({ id, name: name || `Dompet ${cleaned.length + 1}` });
    });

    return cleaned;
}

function processFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);

            // Format baru: { wallets, transactions }. Format lama: array transaksi.
            const isBackup =
                imported &&
                typeof imported === "object" &&
                !Array.isArray(imported);
            const rawTransactions = Array.isArray(imported)
                ? imported
                : isBackup && Array.isArray(imported.transactions)
                  ? imported.transactions
                  : null;

            if (!rawTransactions) {
                alert("Format file tidak didukung.");
            } else {
                // Backup lengkap memulihkan dompet beserta namanya
                if (isBackup) {
                    const restoredWallets = normalizeWallets(imported.wallets);
                    if (restoredWallets.length) {
                        wallets = restoredWallets;
                        activeWalletId = wallets[0].id;
                    }
                }

                if (!wallets.some(wallet => wallet.id === activeWalletId)) {
                    activeWalletId = wallets[0].id;
                }

                // Pastikan setiap transaksi menempel ke dompet yang valid
                transactions = rawTransactions.map(item => ({
                    ...item,
                    walletId: wallets.some(wallet => wallet.id === item.walletId)
                        ? item.walletId
                        : activeWalletId
                }));

                saveAndRender();
                alert("Data berhasil diimpor.");
            }
        } catch (err) {
            alert("File rusak atau bukan format JSON.");
        }
        fileInputHidden.value = "";
    };
    reader.readAsText(file);
}

fileInputHidden.addEventListener("change", processFile);

importBtn.addEventListener("click", () => {
    console.log("Membuka file picker...");

    // Tutup menu dengan animasi dulu
    closeOverlay(menuOverlay, ".menu-window");

    // Klik input "gaib"
    fileInputHidden.click();
});

// Jalankan fungsi render pertama kali
saveAndRender();

// Registrasi PWA + pastikan pembaruan langsung dipakai
if ("serviceWorker" in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let isRefreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Muat ulang sekali saja, dan hanya jika sebelumnya sudah ada SW lama
        if (!hadController || isRefreshing) return;
        isRefreshing = true;
        window.location.reload();
    });

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then(reg => {
                console.log("Service Worker terdaftar!", reg);
                reg.update();
            })
            .catch(err => console.log("Gagal daftar:", err));
    });
}

// --- LOGIKA HAPUS SEMUA DATA ---

const deleteAllBtn = document.getElementById("delete-all");

deleteAllBtn.addEventListener("click", () => {
    // 1. Berikan konfirmasi ke pengguna
    const isConfirmed = confirm("Apakah Anda yakin ingin menghapus seluruh riwayat transaksi di semua dompet? Tindakan ini tidak bisa dibatalkan.");

    if (isConfirmed) {
        // 2. Kosongkan array transactions
        transactions = [];

        // 3. Simpan perubahan ke LocalStorage & Update UI
        saveAndRender();

        // 4. Tutup menu dengan animasi GSAP
        closeOverlay(menuOverlay, ".menu-window");

        alert("Semua data telah dibersihkan.");
    }
});
