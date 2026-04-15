function getAppStorageScope() {
    if (typeof window === "undefined") {
        return "app";
    }

    const path = String(window.location?.pathname || "/").replace(/^\/+|\/+$/g, "");
    const [rootSegment] = path.split("/");
    return rootSegment || "app";
}

function scopeStorageKey(key) {
    return `${getAppStorageScope()}::${String(key || "")}`;
}

function scopeDatabaseName(name) {
    return `${String(name || "")}::${getAppStorageScope()}`;
}

export {
    getAppStorageScope,
    scopeDatabaseName,
    scopeStorageKey,
};
