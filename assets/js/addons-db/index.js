const ADDONS_URL = "https://raw.githubusercontent.com/openhab-nodes/addons-registry/master/extensions.json"
const ADDONS_STATS_URL = "https://raw.githubusercontent.com/openhab-nodes/addons-registry/master/extensions_stats.json"
const ADDONS_RECOMMENDED_URL = "/run/recommended_extensions.json"
const ADDONS_PERMISSIONS = "/run/permissions.json"

function sortedIndexDownloads(array, value) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid].stat.d > value.stat.d) low = mid + 1;
        else high = mid;
    }
    array.splice(low, 0, value);
    return array;
}

function sortedIndexLastUpdated(array, value) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid].last_updated > value.last_updated) low = mid + 1;
        else high = mid;
    }
    array.splice(low, 0, value);
    return array;
}

class AddonDB extends EventTarget {
    constructor() {
        super();
        this.db_by_id = {};
        this.stats = {};
    }

    async from_cache_or_fetch(key, url) {
        let list = localStorage.getItem(key);
        if (list) list = JSON.parse(list);
        if (list && list.valid_until > Date.now()) {
            // list.valid_until;
            return list.data;
        } else {
            const resData = await fetch(url, { cache: "default" });
            let result = await resData.json();
            let d = new Date(Date.now());
            d.setHours(d.getHours() + 1);
            localStorage.setItem(key, JSON.stringify({ data: result, valid_until: d.getTime() }));
            return result;
        }
    }
    
    async start() {
        this.dispatchEvent(new CustomEvent('loader', { detail: {} }));

        let recommended;
        await Promise.all([this.from_cache_or_fetch("permissions.json", ADDONS_PERMISSIONS).then(r => this.permissions = r),
        this.from_cache_or_fetch("recommended.json", ADDONS_RECOMMENDED_URL).then(r => recommended = r),
        this.from_cache_or_fetch("extensions.json", ADDONS_URL).then(r => this.db_by_id = r),
        this.from_cache_or_fetch("extensions_stats.json", ADDONS_STATS_URL).then(r => this.stats = r)]);

        this.last_updated = [];
        this.often_installed = [];
        this.recommended = [];
        let searchstr = "";
        for(let [addonid, item] of Object.entries(this.db_by_id)) {
            if (recommended[item.id]) {
                this.recommended.push(Object.assign(item, recommended[item.id]));
            }
            item.stat = this.stats[item.id];

            // Adapt relative urls to absolute urls
            if (item.changelog_url && item.changelog_url.startsWith("/")) {
                item.changelog_url = item.github + item.changelog_url;
            }

            // Build often-installed
            if (item.stat && item.stat.d)
                sortedIndexDownloads(this.often_installed, item);
            // Build last-updated
            sortedIndexLastUpdated(this.last_updated, item);
            // Build searchable string
            searchstr += JSON.stringify({
                id: item.id, label: item.title,
                author: item.author, description: item.description,
                manufacturers: item.manufacturers, products: item.products
            });
        }

        this.searchstr = searchstr;

        this.dispatchEvent(new CustomEvent('loader', { detail: { ok: this } }));
        return this;
    }

    invalidate_cache() {
        localStorage.removeItem("extensions.json");
        localStorage.removeItem("extensions_stats.json");
        this.start();
    }
}

if (!window.addondb) {
    const db = new AddonDB();
    window.addondb = db.start();
}
