// utils/hafasParser.js
// Parse HTML snippets produced by HAFAS-like connection lists to extract duration and distance
// Example target strings found in markup: "0:45" (duration), "50,2 km" (distance)

/**
 * Parse a duration string like "0:45" or "45" into minutes (number).
 * Returns integer minutes or null.
 */
export function parseDurationToMinutes(txt) {
  if (!txt || typeof txt !== 'string') return null;
  const s = txt.trim();
  // format H:MM or HH:MM
  const mmMatch = s.match(/^(\d{1,2}):(\d{2})$/);
  if (mmMatch) {
    const hours = parseInt(mmMatch[1], 10);
    const mins = parseInt(mmMatch[2], 10);
    if (!isNaN(hours) && !isNaN(mins)) return hours * 60 + mins;
  }
  // plain minutes like "45" or "45 min"
  const numMatch = s.match(/(\d+[\.,]?\d*)/);
  if (numMatch) {
    const raw = numMatch[1].replace(',', '.');
    const v = parseFloat(raw);
    if (!isNaN(v)) return Math.round(v);
  }
  return null;
}

/**
 * Parse a distance string like "50,2 km", "50200 m", "35.9 km" into meters (integer) or null.
 */
export function parseDistanceToMeters(txt) {
  if (!txt || typeof txt !== 'string') return null;
  const s = txt.trim();
  // find number and unit
  const m = s.match(/(\d+[\.,]?\d*)\s*(km|m)?/i);
  if (!m) return null;
  const rawNum = m[1].replace(',', '.');
  const num = parseFloat(rawNum);
  if (isNaN(num)) return null;
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'km') return Math.round(num * 1000);
  if (unit === 'm' || unit === '') {
    // if no unit, assume km if number has decimal and > 10? keep simple: if number > 1000 assume meters
    if (num > 1000) return Math.round(num);
    // otherwise treat as meters
    return Math.round(num);
  }
  return null;
}

/**
 * Given an HTML string (a snippet of the HAFAS connection list), try to extract duration and distance.
 * Returns: { durationMinutes, durationText, distanceMeters, distanceText } where fields can be null.
 */
export function parseHafasConnectionHTML(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') return { durationMinutes: null, durationText: null, distanceMeters: null, distanceText: null };
  // Use DOMParser in browser environment; fallback to regex parsing if not available
  let text = '';
  try {
    if (typeof window !== 'undefined' && window.DOMParser) {
      const dp = new DOMParser();
      const doc = dp.parseFromString(htmlString, 'text/html');
      // Try common selectors based on snippet
      // duration appears in element with aria-hidden true and content like '0:45'
      const durationEl = doc.querySelector('.lyr_tpResultOvInfo .lyr_tpInfoItem:first-child, .lyr_tpResultOvInfo');
      let durationText = null;
      if (durationEl) {
        // find any text like H:MM inside node
        const match = durationEl.textContent && durationEl.textContent.match(/\d{1,2}:\d{2}/);
        if (match) durationText = match[0].trim();
      }
      // distance
      const distEl = doc.querySelector('.lyr_tpResultOvInfo .lyr_tpInfoItem:nth-child(2)');
      let distanceText = null;
      if (distEl) {
        const m = distEl.textContent && distEl.textContent.match(/\d+[\.,]?\d*\s*(km|m)?/i);
        if (m) distanceText = m[0].trim();
      }

      // fallback: search whole text for first duration and distance
      const whole = doc.body ? doc.body.textContent : htmlString;
      if (!durationText) {
        const dm = whole.match(/\b\d{1,2}:\d{2}\b/);
        if (dm) durationText = dm[0];
      }
      if (!distanceText) {
        const km = whole.match(/\d+[\.,]?\d*\s*(km|m)\b/i);
        if (km) distanceText = km[0];
      }

      const durationMinutes = durationText ? parseDurationToMinutes(durationText) : null;
      const distanceMeters = distanceText ? parseDistanceToMeters(distanceText) : null;
      return { durationMinutes, durationText: durationText || null, distanceMeters, distanceText: distanceText || null };
    }
  } catch (err) {
    // ignore and fallback to regex
  }

  // Regex fallback: search for duration and distance in raw string
  const durMatch = htmlString.match(/\b\d{1,2}:\d{2}\b/);
  const distMatch = htmlString.match(/\d+[\.,]?\d*\s*(km|m)\b/i);
  const durationText = durMatch ? durMatch[0] : null;
  const distanceText = distMatch ? distMatch[0] : null;
  const durationMinutes = durationText ? parseDurationToMinutes(durationText) : null;
  const distanceMeters = distanceText ? parseDistanceToMeters(distanceText) : null;
  return { durationMinutes, durationText, distanceMeters, distanceText };
}

export default { parseDurationToMinutes, parseDistanceToMeters, parseHafasConnectionHTML };
