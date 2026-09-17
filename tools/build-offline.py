"""Bundle the reference site into a single HTML file with no runtime dependencies."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
css = (root / 'styles.css').read_text()
js = (root / 'app.js').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="app.js" defer></script>', '')
html = html.replace('</body>', '<script>\n' + js + '\n</script>\n</body>')
html = html.replace('<a href="offline.html" download="AI-Architecture-Study-Guide.html">Offline copy <span aria-hidden="true">↓</span></a>', '<span class="caption">Offline edition</span>')
(root / 'offline.html').write_text(html)
print('Offline edition rebuilt.')
