function switchTab(tabName, updateUrl) {
    const targetPage = document.getElementById("tab-" + tabName);
    const targetTab = document.querySelector('.nav-tab[data-tab="' + tabName + '"]');

    if (!targetPage || !targetTab) {
        return;
    }

    tabPages.forEach(function (page) {
        page.classList.remove("active");
    });
    navTabs.forEach(function (tab) {
        tab.classList.remove("active");
    });

    targetPage.classList.add("active");
    targetTab.classList.add("active");

    if (updateUrl !== false && window.location.hash !== "#" + tabName) {
        window.history.pushState(null, "", "#" + tabName);
    }
}

function getTabFromUrl() {
    const tabName = window.location.hash.slice(1);
    return document.getElementById("tab-" + tabName) ? tabName : "home";
}

window.addEventListener("hashchange", function () {
    switchTab(getTabFromUrl(), false);
});

document.addEventListener("click", function (event) {
    const tab = event.target.closest(".nav-tab");

    if (tab) {
        event.preventDefault();
        switchTab(tab.dataset.tab);
    }
});

let foodData = []; // will hold our loaded food list
