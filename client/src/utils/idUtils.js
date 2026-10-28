export const getCanonicalId = (val) => {
    if (val === null || val === undefined) return null;

    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (
            trimmed === '[object Object]' ||
            trimmed === 'undefined' ||
            trimmed === 'null' ||
            trimmed.length === 0
        ) {
            return null;
        }
        return trimmed;
    }

    if (typeof val === 'number') {
        return String(val);
    }

    if (typeof val === 'object') {
        // Priority 1: Check complaintId string if present
        if (val.complaintId && typeof val.complaintId === 'string' && val.complaintId.trim().length > 0) {
            const clean = getCanonicalId(val.complaintId);
            if (clean) return clean;
        }

        // Priority 2: Check _id or id
        if (val._id) {
            const clean = getCanonicalId(val._id);
            if (clean) return clean;
        }
        if (val.id) {
            const clean = getCanonicalId(val.id);
            if (clean) return clean;
        }
        if (val.$oid) {
            const clean = getCanonicalId(val.$oid);
            if (clean) return clean;
        }

        // Priority 3: Convert byte arrays to 24-char hex strings safely
        if (val.buffer) {
            if (typeof val.buffer === 'string') return val.buffer;
            if (Array.isArray(val.buffer.data)) {
                return val.buffer.data.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        }
        if (Array.isArray(val.data)) {
            return val.data.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        if (typeof val.toString === 'function') {
            const str = val.toString();
            if (str && str !== '[object Object]' && str !== 'undefined' && str !== 'null') {
                return str;
            }
        }
    }

    return null;
};
