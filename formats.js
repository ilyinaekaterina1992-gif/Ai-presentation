(() => {
  'use strict';

  const WIDTH = 1600;
  const HEIGHT = 900;
  const MAX_PAGES = 30;
  const MAX_FILE = 30 * 1024 * 1024;
  const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
  const canvasForSlide = () => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    return canvas;
  };
  const child = (node, name) => [...(node?.children || [])].find(item => item.localName === name);
  const descendants = (node, name) => [...(node?.getElementsByTagName('*') || [])].filter(item => item.localName === name);
  const first = (node, name) => descendants(node, name)[0];
  const attr = (node, name) => node?.getAttribute(name) || node?.getAttribute(name.split(':').at(-1)) || '';
  const xml = source => {
    const documentXml = new DOMParser().parseFromString(source, 'application/xml');
    if (documentXml.querySelector('parsererror')) throw new Error('Повреждён XML презентации');
    return documentXml;
  };
  const imageMime = path => /\.svg$/i.test(path) ? 'image/svg+xml' : /\.png$/i.test(path) ? 'image/png' : /\.gif$/i.test(path) ? 'image/gif' : /\.webp$/i.test(path) ? 'image/webp' : 'image/jpeg';
  const zipPath = (base, target) => {
    const parts = target.startsWith('/') ? [] : base.split('/').slice(0, -1);
    target.replace(/^\//, '').split('/').forEach(part => { if (part === '..') parts.pop(); else if (part && part !== '.') parts.push(part); });
    return parts.join('/');
  };
  const blobFromCanvas = (canvas, type = 'image/jpeg', quality = .85) => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Не удалось создать изображение слайда')), type, quality));
  const loadImage = source => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Изображение на слайде недоступно'));
    image.src = source;
  });
  const drawImageBlob = async (context, blob, x, y, width, height) => {
    const url = URL.createObjectURL(blob);
    try {
      const image = await loadImage(url);
      context.drawImage(image, x, y, width, height);
    } finally { URL.revokeObjectURL(url); }
  };

  function drawText(context, content, x, y, width, height, size, color, weight, font, align = 'left') {
    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();
    context.font = `${weight} ${size}px ${font}, sans-serif`;
    context.fillStyle = color;
    context.textBaseline = 'top';
    context.textAlign = align;
    const lineHeight = size * 1.16;
    let lineY = y;
    const drawLine = line => {
      if (lineY + lineHeight > y + height + 1) return;
      context.fillText(line, align === 'center' ? x + width / 2 : align === 'right' ? x + width : x, lineY);
      lineY += lineHeight;
    };
    for (const paragraph of String(content || '').split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (line && context.measureText(next).width > width) { drawLine(line); line = word; }
        else line = next;
      }
      drawLine(line);
    }
    context.restore();
  }

  async function renderSlide(data, assetSource, shapePath) {
    const canvas = canvasForSlide();
    const context = canvas.getContext('2d');
    context.fillStyle = data.background || '#ffffff';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    await document.fonts.ready;
    for (const element of data.elements) {
      context.save();
      context.translate(element.x, element.y);
      if (element.type === 'shape') {
        const path = new Path2D(shapePath(element.shapeKind || 'rect', element.w, element.h, element.radius || 0));
        if (element.fillEnabled !== false) { context.fillStyle = element.fill || '#50b848'; context.fill(path); }
        if (element.strokeEnabled) { context.strokeStyle = element.strokeColor || '#1c2b22'; context.lineWidth = element.strokeWidth || 4; context.stroke(path); }
      } else if (element.type === 'text') {
        drawText(context, element.text, 0, 0, element.w, element.h, element.size || 24, element.color || '#1c2b22', element.weight || 400, element.font || 'Inter', element.align || 'left');
      } else if (element.type === 'image') {
        const source = element.assetId ? assetSource(element.assetId) : element.src;
        if (!source) throw new Error('Изображение на слайде недоступно');
        const image = await loadImage(source);
        const kind = element.cropShape || 'rect';
        const path = new Path2D(shapePath(kind, element.w, element.h, element.cropRadius || 0));
        context.clip(path);
        const cover = element.fit === 'cover' || kind !== 'rect';
        const scale = (cover ? Math.max(element.w / image.naturalWidth, element.h / image.naturalHeight) : Math.min(element.w / image.naturalWidth, element.h / image.naturalHeight)) * (element.cropZoom || 1);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        context.drawImage(image, (element.w - drawWidth) * (element.cropX ?? 50) / 100, (element.h - drawHeight) * (element.cropY ?? 50) / 100, drawWidth, drawHeight);
        if (element.strokeEnabled) { context.strokeStyle = element.strokeColor || '#1c2b22'; context.lineWidth = element.strokeWidth || 4; context.stroke(path); }
      }
      context.restore();
    }
    return canvas;
  }

  async function exportSlides(format, slides, assetSource, shapePath) {
    if (!slides.length) throw new Error('В презентации нет слайдов');
    const images = [];
    for (const slide of slides) images.push(await blobFromCanvas(await renderSlide(slide, assetSource, shapePath), 'image/png'));
    if (format === 'pdf') {
      const documentPdf = await PDFLib.PDFDocument.create();
      for (const blob of images) {
        const png = await documentPdf.embedPng(await blob.arrayBuffer());
        const page = documentPdf.addPage([960, 540]);
        page.drawImage(png, { x: 0, y: 0, width: 960, height: 540 });
      }
      return new Blob([await documentPdf.save()], { type: 'application/pdf' });
    }
    if (format === 'pptx') {
      const presentation = new PptxGenJS();
      presentation.layout = 'LAYOUT_WIDE';
      presentation.author = 'Центр-инвест';
      for (const blob of images) {
        const page = presentation.addSlide();
        page.addImage({ data: await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }), x: 0, y: 0, w: 13.333333, h: 7.5 });
      }
      return presentation.write({ outputType: 'blob' });
    }
    if (format !== 'odp') throw new Error('Неизвестный формат');
    const zip = new JSZip();
    zip.file('mimetype', 'application/vnd.oasis.opendocument.presentation', { compression: 'STORE' });
    const pages = images.map((_, index) => `<draw:page draw:name="Слайд ${index + 1}" draw:style-name="dp1" draw:master-page-name="Default"><draw:frame draw:style-name="fr1" svg:x="0cm" svg:y="0cm" svg:width="28.222cm" svg:height="15.875cm"><draw:image xlink:href="Pictures/slide${index + 1}.png" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame></draw:page>`).join('');
    zip.file('content.xml', `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.2"><office:automatic-styles><style:style style:name="dp1" style:family="drawing-page"/><style:style style:name="fr1" style:family="graphic"/></office:automatic-styles><office:body><office:presentation>${pages}</office:presentation></office:body></office:document-content>`);
    zip.file('styles.xml', '<?xml version="1.0" encoding="UTF-8"?><office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.2"><office:styles/><office:automatic-styles><style:page-layout style:name="layout1"><style:page-layout-properties svg:width="28.222cm" svg:height="15.875cm"/></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Default" style:page-layout-name="layout1"/></office:master-styles></office:document-styles>');
    zip.file('meta.xml', '<?xml version="1.0" encoding="UTF-8"?><office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" office:version="1.2"><office:meta/></office:document-meta>');
    const entries = ['<manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>', ...['content.xml', 'styles.xml', 'meta.xml'].map(path => `<manifest:file-entry manifest:full-path="${path}" manifest:media-type="text/xml"/>`)];
    for (let index = 0; index < images.length; index++) {
      zip.file(`Pictures/slide${index + 1}.png`, images[index]);
      entries.push(`<manifest:file-entry manifest:full-path="Pictures/slide${index + 1}.png" manifest:media-type="image/png"/>`);
    }
    zip.file('META-INF/manifest.xml', `<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">${entries.join('')}</manifest:manifest>`);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.presentation', compression: 'DEFLATE' });
  }

  async function pdfPages(file) {
    const pdfjs = await import('./vendor/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', location.href).href;
    const documentPdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    if (documentPdf.numPages > MAX_PAGES) throw new Error(`Не более ${MAX_PAGES} страниц за один импорт`);
    const pages = [];
    for (let index = 1; index <= documentPdf.numPages; index++) {
      const page = await documentPdf.getPage(index);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(WIDTH / base.width, HEIGHT / base.height);
      const viewport = page.getViewport({ scale, offsetX: (WIDTH - base.width * scale) / 2, offsetY: (HEIGHT - base.height * scale) / 2 });
      const canvas = canvasForSlide();
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, WIDTH, HEIGHT);
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      pages.push(await blobFromCanvas(canvas));
      page.cleanup();
    }
    await documentPdf.destroy();
    return pages;
  }

  async function pptxPages(zip) {
    const slideFiles = Object.keys(zip.files).filter(path => /^ppt\/slides\/slide\d+\.xml$/.test(path)).sort((left, right) => Number(left.match(/\d+(?=\.xml$)/)[0]) - Number(right.match(/\d+(?=\.xml$)/)[0]));
    if (!slideFiles.length) throw new Error('Слайды PPTX не найдены');
    if (slideFiles.length > MAX_PAGES) throw new Error(`Не более ${MAX_PAGES} слайдов за один импорт`);
    const presentation = xml(await zip.file('ppt/presentation.xml').async('string'));
    const size = first(presentation, 'sldSz');
    const ratioX = WIDTH / (Number(attr(size, 'cx')) || 12192000);
    const ratioY = HEIGHT / (Number(attr(size, 'cy')) || 6858000);
    const pages = [];
    for (const path of slideFiles) {
      const documentXml = xml(await zip.file(path).async('string'));
      const relationshipsPath = path.replace('slides/', 'slides/_rels/') + '.rels';
      const relationships = zip.file(relationshipsPath) ? xml(await zip.file(relationshipsPath).async('string')) : null;
      const targets = new Map(descendants(relationships, 'Relationship').map(item => [attr(item, 'Id'), zipPath(path, attr(item, 'Target'))]));
      const canvas = canvasForSlide(); const context = canvas.getContext('2d');
      const background = first(first(documentXml, 'bg'), 'srgbClr');
      context.fillStyle = background ? `#${attr(background, 'val')}` : '#ffffff'; context.fillRect(0, 0, WIDTH, HEIGHT);
      const tree = first(documentXml, 'spTree');
      let drawn = 0;
      for (const item of tree?.children || []) {
        if (!['sp', 'pic'].includes(item.localName)) continue;
        const transform = first(child(item, 'spPr'), 'xfrm');
        const off = first(transform, 'off'); const ext = first(transform, 'ext');
        if (!off || !ext) continue;
        const x = Number(attr(off, 'x')) * ratioX, y = Number(attr(off, 'y')) * ratioY;
        const width = Number(attr(ext, 'cx')) * ratioX, height = Number(attr(ext, 'cy')) * ratioY;
        if (!(width > 0 && height > 0)) continue;
        if (item.localName === 'pic') {
          const target = targets.get(attr(first(item, 'blip'), 'r:embed'));
          if (target && zip.file(target)) {
            try { await drawImageBlob(context, new Blob([await zip.file(target).async('arraybuffer')], { type: imageMime(target) }), x, y, width, height); drawn++; } catch (_) {}
          }
        } else {
          const properties = child(item, 'spPr');
          const fill = first(child(properties, 'solidFill'), 'srgbClr');
          if (fill) { context.fillStyle = `#${attr(fill, 'val')}`; context.fillRect(x, y, width, height); drawn++; }
          const paragraphs = descendants(child(item, 'txBody'), 'p');
          const content = paragraphs.map(paragraph => descendants(paragraph, 't').map(part => part.textContent).join('')).join('\n').trim();
          if (content) {
            const run = first(child(item, 'txBody'), 'rPr');
            const size = Math.max(14, Number(attr(run, 'sz')) / 100 * (96 / 72) || 28) * ratioY / (HEIGHT / 900);
            const tone = first(child(run, 'solidFill'), 'srgbClr');
            drawText(context, content, x + 8, y + 5, width - 16, height - 10, size, tone ? `#${attr(tone, 'val')}` : '#1c2b22', attr(run, 'b') === '1' ? 700 : 400, 'Arial');
            drawn++;
          }
        }
      }
      if (!drawn) throw new Error('Не удалось прочитать содержимое слайда PPTX');
      pages.push(await blobFromCanvas(canvas));
    }
    return pages;
  }

  const inches = value => {
    const match = String(value || '').match(/^([\d.]+)(cm|mm|in|pt|px)?$/);
    if (!match) return 0;
    return Number(match[1]) * ({ cm: 1 / 2.54, mm: 1 / 25.4, in: 1, pt: 1 / 72, px: 1 / 96 }[match[2] || 'in']);
  };
  async function odpPages(zip) {
    const content = zip.file('content.xml');
    if (!content) throw new Error('Слайды ODP не найдены');
    const documentXml = xml(await content.async('string'));
    const pagesXml = descendants(documentXml, 'page').filter(item => item.namespaceURI?.includes('drawing'));
    if (!pagesXml.length) throw new Error('Слайды ODP не найдены');
    if (pagesXml.length > MAX_PAGES) throw new Error(`Не более ${MAX_PAGES} слайдов за один импорт`);
    const styles = zip.file('styles.xml') ? xml(await zip.file('styles.xml').async('string')) : null;
    const pageSize = first(styles, 'page-layout-properties');
    const pageWidth = inches(attr(pageSize, 'svg:width')) || 11.111;
    const pageHeight = inches(attr(pageSize, 'svg:height')) || 6.25;
    const xScale = WIDTH / pageWidth, yScale = HEIGHT / pageHeight;
    const pages = [];
    for (const page of pagesXml) {
      const canvas = canvasForSlide(); const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, WIDTH, HEIGHT);
      let drawn = 0;
      for (const item of page.children) {
        if (!['frame', 'rect', 'custom-shape'].includes(item.localName)) continue;
        const x = inches(attr(item, 'svg:x')) * xScale, y = inches(attr(item, 'svg:y')) * yScale;
        const width = inches(attr(item, 'svg:width')) * xScale, height = inches(attr(item, 'svg:height')) * yScale;
        if (!(width > 0 && height > 0)) continue;
        const image = first(item, 'image');
        if (image) {
          const path = attr(image, 'xlink:href').replace(/^\.\//, '');
          if (zip.file(path)) {
            try { await drawImageBlob(context, new Blob([await zip.file(path).async('arraybuffer')], { type: imageMime(path) }), x, y, width, height); drawn++; } catch (_) {}
          }
        }
        const texts = descendants(item, 'p').map(node => node.textContent.trim()).filter(Boolean).join('\n');
        if (texts) { drawText(context, texts, x + 8, y + 5, width - 16, height - 10, 28, '#1c2b22', 400, 'Arial'); drawn++; }
      }
      if (!drawn) throw new Error('Не удалось прочитать содержимое слайда ODP');
      pages.push(await blobFromCanvas(canvas));
    }
    return pages;
  }

  async function imagePages(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      const canvas = canvasForSlide();
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, WIDTH, HEIGHT);
      const scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
      return [await blobFromCanvas(canvas, 'image/png')];
    } finally { URL.revokeObjectURL(url); }
  }

  async function importPages(file) {
    if (!file.size || file.size > MAX_FILE) throw new Error('Размер шаблона должен быть не больше 30 МБ');
    const extension = file.name.split('.').at(-1).toLowerCase();
    if (extension === 'pdf') return pdfPages(file);
    if (IMAGE_EXTENSIONS.includes(extension) || file.type.startsWith('image/')) return imagePages(file);
    if (!['pptx', 'odp'].includes(extension)) throw new Error('Нужен файл PDF, PPTX, ODP или изображение');
    const zip = await JSZip.loadAsync(file);
    return extension === 'pptx' ? pptxPages(zip) : odpPages(zip);
  }

  window.StudioFormats = { exportSlides, importPages };
})();
