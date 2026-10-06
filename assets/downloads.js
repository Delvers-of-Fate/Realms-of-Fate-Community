/* No token is needed for public GitHub releases. Never put a token in this file. */
(function () {
  'use strict';
  function selectRelease(release, config) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository)) throw new Error('Invalid release repository');
    if (!release || release.draft || release.prerelease) return null;
    const preferred = Array.isArray(config.assetNames) ? config.assetNames : [];
    const prefix = '/' + config.repository.toLowerCase() + '/releases/download/';
    const files = (Array.isArray(release.assets) ? release.assets : []).filter(asset => {
      if (!asset || asset.state !== 'uploaded' || typeof asset.name !== 'string' || !(asset.size > 0)) return false;
      if (preferred.length && !preferred.includes(asset.name)) return false;
      if (!preferred.length && (!/\.(zip|7z|exe|msi|dmg|pkg|appimage|deb|rpm|jar|tar\.gz|tar\.xz)$/i.test(asset.name) || /(?:^|[-_. ])(?:source|sources|symbols|debug)(?:[-_. ]|$)/i.test(asset.name))) return false;
      try {
        const url = new URL(asset.browser_download_url);
        return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && url.pathname.toLowerCase().startsWith(prefix);
      } catch (_) { return false; }
    });
    if (preferred.length) files.sort((a,b) => preferred.indexOf(a.name) - preferred.indexOf(b.name));
    return { version: String(release.name || release.tag_name || 'Latest release'), date: release.published_at, notes: typeof release.body === 'string' ? release.body : '', files };
  }
  function sizeLabel(bytes) { return bytes < 1048576 ? Math.ceil(bytes / 1024) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB'; }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { selectRelease, sizeLabel }; return; }
  const el = id => document.getElementById(id);
  if (!el('download-primary')) return;
  let busy = false;
  async function fetchJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) { const error = new Error('Request failed'); error.status = response.status; throw error; }
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  function unavailable(message, label) {
    el('download-placeholder').hidden = false;
    el('download-placeholder').textContent = label || 'Download unavailable';
    el('release-status').textContent = message;
    el('release-retry').hidden = false;
  }
  async function load() {
    if (busy) return;
    busy = true;
    el('download-primary').hidden = true;
    el('download-primary').removeAttribute('href');
    el('release-files').hidden = true;
    el('release-notes').hidden = true;
    el('release-retry').hidden = true;
    el('download-files').replaceChildren();
    el('download-placeholder').hidden = false;
    el('download-placeholder').textContent = 'Checking for a build…';
    el('release-status').textContent = 'Looking for the latest game files.';
    el('release-version').textContent = 'Latest public release';
    try {
      const config = await fetchJson(new URL('assets/releases.json', document.baseURI));
      if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository)) throw new Error('Invalid configuration');
      let data;
      try { data = await fetchJson('https://api.github.com/repos/' + config.repository + '/releases/latest'); }
      catch (error) {
        if (error.status === 404) { unavailable('No public release is available from the game repository yet. Check back for the first downloadable build.', 'No public build yet'); return; }
        throw error;
      }
      const release = selectRelease(data, config);
      if (!release) { unavailable('No public stable release is available yet.', 'No public build yet'); return; }
      el('release-version').textContent = release.version;
      if (release.notes) {
        el('release-notes-body').textContent = release.notes;
        const date = new Date(release.date);
        el('release-date').textContent = Number.isNaN(date.getTime()) ? release.version : release.version + ' · ' + date.toLocaleDateString(undefined, {year:'numeric',month:'long',day:'numeric'});
        el('release-notes').hidden = false;
      }
      if (!release.files.length) { unavailable('This release has no downloadable game package attached yet.'); return; }
      const primary = release.files[0];
      el('download-primary').href = primary.browser_download_url;
      el('download-primary').textContent = 'Download ' + primary.name;
      el('download-primary').hidden = false;
      el('download-placeholder').hidden = true;
      el('release-status').textContent = sizeLabel(primary.size) + ' · Direct file download';
      for (const file of release.files) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = file.browser_download_url;
        link.textContent = file.name;
        const size = document.createElement('small');
        size.textContent = sizeLabel(file.size);
        li.append(link, size);
        el('download-files').append(li);
      }
      el('release-files').hidden = release.files.length < 2;
    } catch (error) {
      unavailable(error.status === 403 || error.status === 429 ? 'GitHub is limiting release checks right now. Please try again later.' : 'Could not check the latest release. Check your connection and try again.');
    } finally { busy = false; }
  }
  el('release-retry').addEventListener('click', load);
  load();
})();
