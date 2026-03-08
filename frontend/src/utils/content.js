export function getLocalized(item, field, lang) {
    if (!item) return ''

    // Debug log to see what's happening
    // console.log(`getLocalized: field=${field}, lang=${lang}`, item);

    // Check if language starts with 'en' (e.g. 'en', 'en-US', 'en-GB')
    if (lang && lang.toLowerCase().startsWith('en')) {
        const val = item[`${field}_en`]
        if (val && val.trim().length > 0) {
            return val
        }
    }

    // Fallback to original field (if it exists) or Italian version
    return item[field] || item[`${field}_it`] || ''
}
