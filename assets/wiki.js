(() => {
  const status = document.getElementById('copy-status');
  let timer;
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const code = document.getElementById(button.dataset.copy);
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = 'Copied!';
        if (status) status.textContent = 'JSON copied. Paste it into the file or object described by the guide.';
      } catch (_) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
        if (status) status.textContent = 'Clipboard unavailable. JSON selected; press Ctrl+C or use Download.';
      }
      window.setTimeout(() => { button.textContent = 'Copy JSON'; }, 2000);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { if (status) status.textContent = ''; }, 5000);
    });
  });
})();
