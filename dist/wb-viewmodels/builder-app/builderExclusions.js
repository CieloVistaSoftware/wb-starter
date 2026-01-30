// Loads the exclusion list for builder UI
export async function getComponentExclusions() {
    try {
        const res = await fetch('./data/componentExclusions.json');
        if (!res.ok)
            return [];
        const data = await res.json();
        return Array.isArray(data.exclude) ? data.exclude : [];
    }
    catch (e) {
        console.log('ComponentExclusions fetch failed, using empty list:', e);
        return [];
    }
}
//# sourceMappingURL=builderExclusions.js.map