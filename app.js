(() => {
  'use strict';

  const WIDTH = 1600;
  const HEIGHT = 900;
  const LIMIT = 2 * 1024 * 1024;
  const STORAGE_KEY = 'centrinvest-studio-v1';
  const FONTS = ['Inter', 'Roboto', 'Montserrat'];
  const COLORS = ['#50b848', '#287e3b', '#174f31', '#1c2b22', '#ffffff', '#f1f3f9', '#eaf6e9', '#ffc928'];
  const REFERENCE_SLIDES = ['Обложка', 'О банке', 'Рейтинги и показатели', 'Комплексное предложение', 'Тарифы РКО', 'Онлайн-касса', 'Преимущества предложения', 'Модели оборудования', 'Клиент-Банк', 'Карта МИР', 'Контакты'];
  const TEMPLATE_INFO = [
    { id: 'spotlight', title: 'Главное на одном слайде', note: 'Крупный заголовок и объёмная графика', tag: 'HERO' },
    { id: 'acquiring', title: 'Бизнесу проще', note: 'Продуктовая обложка с карточкой', tag: 'ПРОДУКТ' },
    { id: 'offer-cover', title: 'Коммерческое предложение', note: 'Светлая обложка по образцу предложения для бизнеса', tag: 'КП' },
    { id: 'mortgage', title: 'Зелёная ипотека', note: 'Светлая обложка с иллюстрацией', tag: 'ОБЛОЖКА' },
    { id: 'facts', title: 'Цифры и факты', note: 'Контрастная bento-сетка', tag: 'BENTO' },
    { id: 'roadmap', title: 'Этапы проекта', note: 'Три шага без перегруза', tag: 'СХЕМА' },
    { id: 'partners', title: 'Партнёрский проект', note: 'Тёмный акцент и место для логотипа', tag: 'ПАРТНЁРЫ' },
    { id: 'editorial', title: 'История проекта', note: 'Редакционная композиция', tag: 'ИСТОРИЯ' },
    { id: 'blank', title: 'Чистый лист', note: 'Свободная композиция 16:9', tag: 'БАЗА' }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icon = name => `<svg class="icon"><use href="#i-${name}"/></svg>`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const font = value => FONTS.includes(value) ? value : 'Inter';
  const color = value => /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1c2b22';
  const SHAPES = [
    { id: 'rect', label: 'Прямоугольник' },
    { id: 'ellipse', label: 'Эллипс' },
    { id: 'triangle', label: 'Треугольник' },
    { id: 'diamond', label: 'Ромб' },
    { id: 'hexagon', label: 'Шестиугольник' },
    { id: 'star', label: 'Звезда' }
  ];
  const shapeKind = value => SHAPES.some(option => option.id === value) ? value : 'rect';
  const bounded = (value, fallback, min, max) => Number.isFinite(Number(value)) && value !== '' && value != null ? clamp(Number(value), min, max) : fallback;
  const coordinate = value => Math.round(value * 100) / 100;
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svgElement = name => document.createElementNS(svgNamespace, name);

  function shapePath(kind, width, height, radius = 0, inset = 0) {
    const left = inset;
    const top = inset;
    const right = Math.max(left + 1, width - inset);
    const bottom = Math.max(top + 1, height - inset);
    const innerWidth = right - left;
    const innerHeight = bottom - top;
    const cornerRadius = clamp(radius, 0, Math.min(innerWidth, innerHeight) / 2);
    if (kind === 'rect') {
      if (!cornerRadius) return `M ${left} ${top} H ${right} V ${bottom} H ${left} Z`;
      const nearLeft = coordinate(left + cornerRadius);
      const nearRight = coordinate(right - cornerRadius);
      const nearTop = coordinate(top + cornerRadius);
      const nearBottom = coordinate(bottom - cornerRadius);
      return `M ${nearLeft} ${top} H ${nearRight} Q ${right} ${top} ${right} ${nearTop} V ${nearBottom} Q ${right} ${bottom} ${nearRight} ${bottom} H ${nearLeft} Q ${left} ${bottom} ${left} ${nearBottom} V ${nearTop} Q ${left} ${top} ${nearLeft} ${top} Z`;
    }
    if (kind === 'ellipse') {
      const centerX = coordinate((left + right) / 2);
      const centerY = coordinate((top + bottom) / 2);
      return `M ${centerX} ${top} A ${coordinate(innerWidth / 2)} ${coordinate(innerHeight / 2)} 0 1 1 ${centerX} ${bottom} A ${coordinate(innerWidth / 2)} ${coordinate(innerHeight / 2)} 0 1 1 ${centerX} ${top} Z`;
    }
    const points = {
      triangle: [[.5, 0], [1, 1], [0, 1]],
      diamond: [[.5, 0], [1, .5], [.5, 1], [0, .5]],
      hexagon: [[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5]],
      star: Array.from({ length: 10 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI / 5;
        const distance = index % 2 ? .23 : .5;
        return [.5 + Math.cos(angle) * distance, .5 + Math.sin(angle) * distance];
      })
    }[shapeKind(kind)];
    const vertices = points.map(([horizontal, vertical]) => ({ x: left + horizontal * innerWidth, y: top + vertical * innerHeight }));
    const position = point => `${coordinate(point.x)} ${coordinate(point.y)}`;
    if (!cornerRadius) return `M ${position(vertices[0])} ${vertices.slice(1).map(vertex => `L ${position(vertex)}`).join(' ')} Z`;
    const corners = vertices.map((vertex, index) => {
      const previous = vertices[(index + vertices.length - 1) % vertices.length];
      const following = vertices[(index + 1) % vertices.length];
      const previousLength = Math.hypot(previous.x - vertex.x, previous.y - vertex.y);
      const followingLength = Math.hypot(following.x - vertex.x, following.y - vertex.y);
      const distance = Math.min(cornerRadius, previousLength * .45, followingLength * .45);
      return {
        vertex,
        incoming: { x: vertex.x + (previous.x - vertex.x) * distance / previousLength, y: vertex.y + (previous.y - vertex.y) * distance / previousLength },
        outgoing: { x: vertex.x + (following.x - vertex.x) * distance / followingLength, y: vertex.y + (following.y - vertex.y) * distance / followingLength }
      };
    });
    return `M ${position(corners[0].incoming)} ${corners.map((corner, index) => `Q ${position(corner.vertex)} ${position(corner.outgoing)} L ${position(corners[(index + 1) % corners.length].incoming)}`).join(' ')} Z`;
  }

  function shapePreview(kind) {
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${shapePath(kind, 32, 32, kind === 'rect' ? 5 : 0, 2)}"/></svg>`;
  }

  function shapeArtwork(element, kind, radius, fill = 'none') {
    const artwork = svgElement('svg');
    artwork.classList.add('element-artwork');
    artwork.setAttribute('viewBox', `0 0 ${element.w} ${element.h}`);
    artwork.setAttribute('preserveAspectRatio', 'none');
    artwork.setAttribute('aria-hidden', 'true');
    const outlineWidth = element.strokeEnabled === true ? bounded(element.strokeWidth, 4, 1, 32) : 0;
    const path = svgElement('path');
    path.setAttribute('d', shapePath(kind, element.w, element.h, radius, outlineWidth / 2));
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', outlineWidth ? color(element.strokeColor || '#1c2b22') : 'none');
    path.setAttribute('stroke-width', String(outlineWidth));
    path.setAttribute('stroke-linejoin', 'round');
    artwork.append(path);
    return artwork;
  }

  const text = (content, x, y, w, h, size, tone = '#1c2b22', weight = 400, family = 'Inter', align = 'left') => ({ id: uid(), type: 'text', text: content, x, y, w, h, size, color: tone, weight, font: family, align });
  const shape = (x, y, w, h, fill, radius = 0, kind = 'rect') => ({ id: uid(), type: 'shape', x, y, w, h, fill, radius, shapeKind: kind, fillEnabled: true, strokeEnabled: false, strokeColor: '#1c2b22', strokeWidth: 4 });
  const image = (src, x, y, w, h, fit = 'contain') => ({ id: uid(), type: 'image', src, x, y, w, h, fit });
  const slide = (name, background, elements) => ({ id: uid(), name, background, elements });

  function buildTemplate(kind) {
    if (kind === 'spotlight') return slide('Главное на одном слайде', '#f7faf6', [
      shape(102, 74, 272, 58, '#e5f4e1', 29),
      text('ЦЕНТР-ИНВЕСТ', 133, 89, 220, 34, 23, '#287e3b', 800, 'Montserrat'),
      text('ПРЕЗЕНТАЦИЯ  ·  2026', 1110, 88, 375, 42, 20, '#78917e', 700, 'Inter', 'right'),
      text('Идеи, которые', 150, 172, 1300, 114, 91, '#1c2b22', 800, 'Montserrat', 'center'),
      text('двигают вперёд', 150, 277, 1300, 116, 91, '#50b848', 800, 'Montserrat', 'center'),
      text('Ваш проект начинается здесь. Замените текст и расскажите главное за один слайд.', 330, 417, 940, 86, 29, '#62766a', 400, 'Inter', 'center'),
      shape(605, 519, 390, 70, '#1d5e39', 35),
      text('ВАШ ПРОЕКТ  ·  2026', 641, 538, 318, 34, 22, '#ffffff', 700, 'Inter', 'center'),
      image('assets/hero-orbit.svg', 250, 577, 1100, 315, 'contain')
    ]);
    if (kind === 'acquiring') return slide('Бизнесу проще', '#f4f7f2', [
      shape(794, 112, 722, 708, '#dcebdd', 56),
      shape(772, 88, 722, 708, '#ffffff', 56),
      text('ЦЕНТР-ИНВЕСТ  /  БИЗНЕСУ', 91, 87, 640, 42, 25, '#287e3b', 800, 'Montserrat'),
      text('Платежи', 86, 215, 680, 111, 86, '#1c2b22', 800, 'Montserrat'),
      text('работают', 86, 324, 680, 107, 86, '#1c2b22', 800, 'Montserrat'),
      text('на вас.', 86, 433, 640, 108, 86, '#50b848', 800, 'Montserrat'),
      text('Эквайринг, онлайн-касса и сервисы, которые помогают бизнесу расти.', 92, 567, 620, 104, 28, '#65776b', 400, 'Inter'),
      shape(91, 709, 319, 72, '#50b848', 36),
      text('ВАШЕ ПРЕДЛОЖЕНИЕ', 117, 728, 267, 34, 19, '#ffffff', 800, 'Inter', 'center'),
      image('assets/product-stack.svg', 790, 130, 680, 640, 'contain'),
      text('01  /  2026', 91, 834, 290, 30, 18, '#9aa99d', 700, 'Inter')
    ]);
    if (kind === 'offer-cover') return slide('Коммерческое предложение', '#ffffff', [
      shape(820, 45, 708, 790, '#e9ece9', 88),
      image('assets/centrinvest-logo.svg', 91, 65, 298, 101, 'contain'),
      text('Предложение для ИП и организаций, осуществляющих расчёты с населением', 92, 290, 678, 205, 54, '#1c2b22', 800, 'Montserrat'),
      text('Эквайринг, онлайн-касса, РКО и дистанционное банковское обслуживание', 92, 559, 630, 125, 31, '#65776b', 400, 'Inter'),
      image('assets/product-stack.svg', 842, 160, 655, 587, 'contain'),
      text('2026', 92, 824, 150, 40, 22, '#849389', 400, 'Inter')
    ]);
    if (kind === 'mortgage') return slide('Зелёная ипотека', '#fbfcfa', [
      shape(797, 72, 730, 744, '#e8f5e7', 60),
      shape(91, 80, 319, 56, '#e7f5e3', 28),
      text('ЦЕНТР-ИНВЕСТ', 123, 95, 260, 34, 23, '#287e3b', 800, 'Montserrat'),
      text('Зелёная', 86, 265, 690, 116, 88, '#1c2b22', 800, 'Montserrat'),
      text('ипотека', 86, 370, 690, 116, 88, '#50b848', 800, 'Montserrat'),
      text('Ближе к дому, который подходит вам и будущему.', 93, 538, 615, 112, 29, '#64766a', 400, 'Inter'),
      shape(91, 699, 278, 105, '#eef6ec', 27),
      shape(385, 699, 278, 105, '#eef6ec', 27),
      text('01  /  КОМФОРТ', 115, 735, 236, 35, 22, '#287e3b', 800, 'Inter'),
      text('02  /  ЭКОЛОГИЯ', 408, 735, 236, 35, 22, '#287e3b', 800, 'Inter'),
      image('assets/eco-home.svg', 822, 112, 682, 678, 'contain'),
      text('2026  ·  БАНК ЦЕНТР-ИНВЕСТ', 93, 844, 570, 30, 18, '#99aa9d', 700, 'Inter')
    ]);
    if (kind === 'facts') return slide('Цифры и факты', '#f2f6f1', [
      text('ЦЕНТР-ИНВЕСТ  /  ОБЗОР', 83, 73, 700, 42, 24, '#287e3b', 800, 'Montserrat'),
      text('Главное — наглядно', 79, 134, 1430, 102, 74, '#1c2b22', 800, 'Montserrat'),
      shape(80, 274, 700, 540, '#1c603b', 54),
      shape(808, 274, 343, 255, '#ffffff', 42),
      shape(1177, 274, 343, 255, '#ffffff', 42),
      shape(808, 555, 712, 259, '#e0f1de', 42),
      shape(560, 326, 138, 138, '#2e784b', 69),
      shape(627, 384, 45, 45, '#50b848', 23),
      text('00+', 126, 337, 430, 190, 151, '#ffffff', 800, 'Montserrat'),
      text('Ваш ключевой показатель', 131, 569, 568, 67, 36, '#ffffff', 700, 'Montserrat'),
      text('Замените данные и подпись под вашу задачу.', 131, 663, 540, 80, 26, '#c7e3cf', 400, 'Inter'),
      text('00%', 841, 325, 290, 100, 68, '#287e3b', 800, 'Montserrat'),
      text('Показатель №1', 843, 448, 273, 48, 25, '#405349', 600, 'Inter'),
      text('00', 1207, 325, 280, 100, 68, '#50b848', 800, 'Montserrat'),
      text('Показатель №2', 1211, 448, 273, 48, 25, '#405349', 600, 'Inter'),
      text('История в цифрах', 849, 604, 610, 65, 44, '#1c2b22', 800, 'Montserrat'),
      text('Каждая карточка — отдельная мысль, которую легко заменить и настроить.', 852, 697, 603, 76, 25, '#657e6a', 400, 'Inter'),
      text('ШАБЛОН  ·  ЗАМЕНИТЕ ПРИМЕРНЫЕ ДАННЫЕ', 84, 849, 870, 30, 17, '#94a596', 700, 'Inter')
    ]);
    if (kind === 'roadmap') return slide('Этапы проекта', '#ffffff', [
      text('ПЛАН ДЕЙСТВИЙ', 84, 72, 570, 43, 26, '#287e3b', 800, 'Montserrat'),
      text('От идеи — к результату', 80, 140, 1440, 107, 76, '#1c2b22', 800, 'Montserrat'),
      text('Три понятных шага для вашей истории.', 84, 260, 990, 57, 29, '#728377', 400, 'Inter'),
      shape(81, 366, 452, 400, '#eaf6e9', 42),
      shape(574, 366, 452, 400, '#f2f5f1', 42),
      shape(1067, 366, 452, 400, '#d7efdb', 42),
      text('01', 119, 414, 340, 121, 99, '#50b848', 800, 'Montserrat'),
      text('Идея', 120, 571, 370, 72, 47, '#1c2b22', 800, 'Montserrat'),
      text('Сформулируйте задачу и её ценность.', 123, 650, 360, 102, 26, '#62796a', 400, 'Inter'),
      text('02', 612, 414, 340, 121, 99, '#287e3b', 800, 'Montserrat'),
      text('Действие', 613, 571, 385, 72, 47, '#1c2b22', 800, 'Montserrat'),
      text('Покажите, что вы делаете на практике.', 616, 650, 360, 102, 26, '#62796a', 400, 'Inter'),
      text('03', 1105, 414, 340, 121, 99, '#174f31', 800, 'Montserrat'),
      text('Результат', 1106, 571, 385, 72, 47, '#1c2b22', 800, 'Montserrat'),
      text('Подведите итог и обозначьте следующий шаг.', 1109, 650, 360, 102, 26, '#62796a', 400, 'Inter'),
      shape(82, 837, 1437, 9, '#e1f1df', 5),
      shape(82, 837, 550, 9, '#50b848', 5)
    ]);
    if (kind === 'partners') return slide('Партнёрский проект', '#173e2a', [
      shape(0, 0, 25, 900, '#50b848'),
      shape(861, 106, 660, 704, '#2b6642', 61),
      shape(840, 85, 660, 704, '#ffffff', 61),
      shape(87, 86, 323, 60, '#2d7245', 30),
      text('ЦЕНТР-ИНВЕСТ', 121, 101, 258, 36, 23, '#c9f0c6', 800, 'Montserrat'),
      text('Сильнее,', 81, 226, 730, 117, 84, '#ffffff', 800, 'Montserrat'),
      text('когда вместе', 81, 336, 730, 118, 79, '#9bdf91', 800, 'Montserrat'),
      text('Место для общей идеи, события или важного партнёрского проекта.', 88, 543, 673, 114, 29, '#d1e8d4', 400, 'Inter'),
      shape(88, 724, 386, 77, '#50b848', 38),
      text('ПАРТНЁРСКИЙ ПРОЕКТ', 122, 748, 318, 37, 22, '#ffffff', 800, 'Inter', 'center'),
      image('assets/community.svg', 868, 120, 611, 545, 'contain'),
      shape(958, 686, 424, 62, '#e6f5e3', 31),
      text('ЛОГОТИП ПАРТНЁРА', 997, 704, 344, 35, 20, '#287e3b', 800, 'Inter', 'center'),
      text('ЦЕНТР-ИНВЕСТ  ×  ПАРТНЁР', 88, 844, 654, 30, 18, '#9fd3a5', 700, 'Inter')
    ]);
    if (kind === 'editorial') return slide('История проекта', '#fbfcfa', [
      shape(72, 70, 550, 760, '#e7f3e6', 54),
      image('assets/community.svg', 82, 170, 530, 540, 'contain'),
      text('ИСТОРИЯ ПРОЕКТА', 720, 91, 680, 46, 26, '#287e3b', 800, 'Montserrat'),
      text('“', 706, 176, 160, 153, 128, '#50b848', 800, 'Montserrat'),
      text('Из идей рождаются изменения.', 714, 313, 779, 277, 75, '#1c2b22', 800, 'Montserrat'),
      shape(719, 665, 88, 8, '#50b848', 4),
      text('Расскажите, кто стоит за проектом и почему это важно.', 719, 703, 729, 90, 27, '#6e8173', 400, 'Inter'),
      text('ЦЕНТР-ИНВЕСТ  ·  2026', 89, 846, 480, 30, 18, '#9aaa9d', 700, 'Inter')
    ]);
    return slide('Чистый лист', '#ffffff', []);
  }
  function initialState() {
    const main = { id: uid(), title: 'Новая презентация', slides: [buildTemplate('spotlight'), buildTemplate('facts')], updatedAt: Date.now() };
    return {
      version: 1,
      projects: [main],
      customTemplates: [],
      activeProjectId: main.id,
      selectedSlideId: main.slides[0].id,
      ui: { panel: 'templates', imageFolder: 'all', partnerFolder: 'all' },
      folders: [
        { id: 'img-finance', bank: 'images', name: 'Финансы', builtin: true },
        { id: 'img-environment', bank: 'images', name: 'Экология', builtin: true },
        { id: 'img-education', bank: 'images', name: 'Образование', builtin: true },
        { id: 'img-other', bank: 'images', name: 'Разное', builtin: true },
        { id: 'partner-universities', bank: 'partners', name: 'Вузы', builtin: true },
        { id: 'partner-mfc', bank: 'partners', name: 'МФЦ', builtin: true },
        { id: 'partner-football', bank: 'partners', name: 'Футбольные клубы', builtin: true },
        { id: 'partner-potok', bank: 'partners', name: 'Поток ЦИ', builtin: true }
      ],
      assets: [
        { id: 'asset-acquiring', bank: 'images', folderId: 'img-finance', name: 'Платежи и бизнес', src: 'assets/acquiring.svg', builtin: true },
        { id: 'asset-mortgage', bank: 'images', folderId: 'img-environment', name: 'Зелёный дом', src: 'assets/mortgage.svg', builtin: true },
        { id: 'asset-education', bank: 'images', folderId: 'img-education', name: 'Образование', src: 'assets/education.svg', builtin: true },
        { id: 'asset-partnership', bank: 'images', folderId: 'img-other', name: 'Сотрудничество', src: 'assets/partnership.svg', builtin: true },
        { id: 'asset-university', bank: 'partners', folderId: 'partner-universities', name: 'Вуз · демо', src: 'assets/partner-university.svg', builtin: true },
        { id: 'asset-mfc', bank: 'partners', folderId: 'partner-mfc', name: 'МФЦ · демо', src: 'assets/partner-mfc.svg', builtin: true },
        { id: 'asset-football', bank: 'partners', folderId: 'partner-football', name: 'Клуб · демо', src: 'assets/partner-football.svg', builtin: true },
        { id: 'asset-potok', bank: 'partners', folderId: 'partner-potok', name: 'Поток ЦИ · демо', src: 'assets/partner-potok.svg', builtin: true }
      ]
    };
  }

  function loadState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (value?.version === 1 && Array.isArray(value.projects) && value.projects.length && Array.isArray(value.assets) && Array.isArray(value.folders)) {
        value.customTemplates = Array.isArray(value.customTemplates) ? value.customTemplates : [];
        return value;
      }
    } catch (_) {}
    return initialState();
  }

  let state = loadState();
  let selectedElementId = null;
  let currentScale = 1;
  let presentationIndex = 0;
  let uploadBank = 'images';
  let openAssetMenu = null;
  let toastTimer;
  let history = [];
  let future = [];
  let database;
  const objectUrls = new Map();

  const project = () => state.projects.find(item => item.id === state.activeProjectId) || state.projects[0];
  const currentSlide = () => project().slides.find(item => item.id === state.selectedSlideId) || project().slides[0];
  const currentElement = () => currentSlide().elements.find(item => item.id === selectedElementId);
  const folderFor = bank => state.ui[bank === 'images' ? 'imageFolder' : 'partnerFolder'];
  const bankFolders = bank => state.folders.filter(folder => folder.bank === bank);
  const assetSource = assetId => {
    const asset = state.assets.find(item => item.id === assetId);
    return asset?.src || objectUrls.get(assetId) || '';
  };

  function save() {
    project().updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $('#save-status').innerHTML = '<span class="save-dot"></span> Сохранено локально';
    } catch (_) {
      $('#save-status').textContent = 'Не удалось сохранить';
      showToast('Недостаточно места для сохранения проекта');
    }
  }

  function remember() {
    history.push(JSON.stringify({ projectId: project().id, slides: project().slides, selectedSlideId: state.selectedSlideId }));
    if (history.length > 30) history.shift();
    future = [];
    renderUndoButtons();
  }

  function restoreHistory(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify({ projectId: project().id, slides: project().slides, selectedSlideId: state.selectedSlideId }));
    const snapshot = JSON.parse(from.pop());
    if (snapshot.projectId !== project().id) return;
    project().slides = snapshot.slides;
    state.selectedSlideId = snapshot.selectedSlideId;
    selectedElementId = null;
    save();
    renderAll();
  }

  function renderUndoButtons() {
    $('#undo').disabled = !history.length;
    $('#redo').disabled = !future.length;
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3600);
  }

  function renderAll() {
    $('#project-title').value = project().title;
    $$('.rail-item').forEach(item => item.classList.toggle('active', item.dataset.panel === state.ui.panel));
    renderPanel();
    renderCanvas();
    renderFilmstrip();
    renderInspector();
    renderUndoButtons();
  }

  function elementDOM(element, interactive) {
    const node = document.createElement('div');
    node.className = 'slide-element';
    node.dataset.id = element.id;
    node.dataset.type = element.type;
    Object.assign(node.style, { left: `${element.x}px`, top: `${element.y}px`, width: `${element.w}px`, height: `${element.h}px` });
    if (element.type === 'shape') {
      node.append(shapeArtwork(element, shapeKind(element.shapeKind), bounded(element.radius, 0, 0, 400), element.fillEnabled === false ? 'none' : color(element.fill)));
    } else if (element.type === 'text') {
      const content = document.createElement('div');
      content.className = 'text-content';
      content.textContent = element.text || '';
      Object.assign(content.style, { fontFamily: `${font(element.font)}, sans-serif`, fontSize: `${clamp(Number(element.size) || 24, 10, 180)}px`, fontWeight: Number(element.weight) === 800 ? '800' : Number(element.weight) === 700 ? '700' : '400', color: color(element.color), textAlign: ['left','center','right'].includes(element.align) ? element.align : 'left' });
      node.append(content);
    } else if (element.type === 'image') {
      const source = element.assetId ? assetSource(element.assetId) : element.src;
      const kind = shapeKind(element.cropShape);
      const radius = bounded(element.cropRadius, 0, 0, 400);
      const outlineWidth = element.strokeEnabled === true ? bounded(element.strokeWidth, 4, 1, 32) : 0;
      const mask = document.createElement('div');
      mask.className = 'image-mask';
      mask.style.clipPath = `path("${shapePath(kind, element.w, element.h, radius, outlineWidth / 2)}")`;
      if (source) {
        const img = document.createElement('img');
        const cropX = bounded(element.cropX, 50, 0, 100);
        const cropY = bounded(element.cropY, 50, 0, 100);
        img.src = source;
        img.alt = '';
        img.draggable = false;
        img.style.objectFit = element.fit === 'cover' || kind !== 'rect' ? 'cover' : 'contain';
        img.style.objectPosition = `${cropX}% ${cropY}%`;
        img.style.transformOrigin = `${cropX}% ${cropY}%`;
        img.style.transform = `scale(${bounded(element.cropZoom, 1, 1, 3)})`;
        mask.append(img);
      }
      node.append(mask);
      if (outlineWidth) node.append(shapeArtwork(element, kind, radius));
    }
    if (interactive) {
      node.classList.toggle('selected', element.id === selectedElementId);
      if (element.id === selectedElementId) {
        const handle = document.createElement('span');
        handle.className = 'resize-handle';
        node.append(handle);
      }
      node.addEventListener('pointerdown', event => startPointer(event, element, node));
      if (element.type === 'text') node.addEventListener('dblclick', () => editText(element, node));
    }
    return node;
  }

  function createSlideDOM(data, className = 'mini-canvas') {
    const canvas = document.createElement('div');
    canvas.className = className;
    canvas.style.background = color(data.background || '#ffffff');
    data.elements.forEach(item => canvas.append(elementDOM(item, false)));
    return canvas;
  }

  function renderCanvas() {
    const data = currentSlide();
    const canvas = $('#slide-canvas');
    canvas.replaceChildren(...data.elements.map(item => elementDOM(item, true)));
    canvas.style.background = color(data.background || '#ffffff');
    $('#stage-caption').textContent = `Слайд ${project().slides.indexOf(data) + 1} · ${data.name}`;
    fitCanvas();
  }

  function fitCanvas() {
    const stage = $('#stage');
    const scale = Math.min((stage.clientWidth - 48) / WIDTH, (stage.clientHeight - 68) / HEIGHT, 1);
    currentScale = Math.max(.08, scale);
    $('#canvas-sizer').style.width = `${WIDTH * currentScale}px`;
    $('#canvas-sizer').style.height = `${HEIGHT * currentScale}px`;
    $('#slide-canvas').style.transform = `scale(${currentScale})`;
    $('#zoom-label').textContent = `${Math.round(currentScale * 100)}%`;
  }

  function renderFilmstrip() {
    const wrap = $('#filmstrip');
    wrap.replaceChildren();
    $('#slide-count').textContent = String(project().slides.length).padStart(2, '0');
    project().slides.forEach((item, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = `slide-tile${item.id === state.selectedSlideId ? ' active' : ''}`;
      tile.dataset.slideId = item.id;
      tile.draggable = true;
      tile.innerHTML = `<div class="slide-tile-frame"></div><div class="slide-tile-caption"><strong>${String(index + 1).padStart(2, '0')}</strong><span>${esc(item.name)}</span></div>`;
      $('.slide-tile-frame', tile).append(createSlideDOM(item));
      wrap.append(tile);
    });
  }

  function referenceSlide(index) {
    const number = String(index + 1).padStart(2, '0');
    return slide(`КП · ${REFERENCE_SLIDES[index]}`, '#ffffff', [image(`assets/reference-offer-${number}.jpg`, 0, 0, WIDTH, HEIGHT)]);
  }

  function renderPanel() {
    const panel = $('#library-panel');
    if (state.ui.panel === 'templates') {
      panel.innerHTML = `<div class="panel-eyebrow">БЫСТРЫЙ СТАРТ</div><h1 class="panel-title">Шаблоны</h1><p class="panel-description">Выберите композицию или добавьте свой шаблон из файла.</p><button class="panel-action" type="button" data-action="import-template">${icon('plus')} Добавить свой шаблон</button><p class="panel-description template-import-note">PDF, PPTX, ODP, PNG, JPG, WebP, GIF или SVG · до 30 МБ. Страницы сохраняются как фоновые изображения и доступны повторно.</p><div class="template-list"></div>`;
      const list = $('.template-list', panel);
      const deckCard = document.createElement('div');
      deckCard.className = 'template-card';
      deckCard.innerHTML = `<div class="template-preview" data-template-set="offer-reference" title="Добавить набор слайдов"><span class="template-badge">11 СЛАЙДОВ</span></div><div class="template-meta"><div><strong>КП для бизнеса · образец</strong><small>11 страниц из презентации 2025 года · как изображения</small></div><button class="template-add" type="button" data-template-set="offer-reference" title="Добавить 11 слайдов" aria-label="Добавить 11 слайдов коммерческого предложения">${icon('plus')}</button></div>`;
      $('.template-preview', deckCard).append(createSlideDOM(referenceSlide(0)));
      list.append(deckCard);
      TEMPLATE_INFO.forEach(info => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `<div class="template-preview" data-template="${info.id}" title="Добавить шаблон"><span class="template-badge">${esc(info.tag)}</span></div><div class="template-meta"><div><strong>${esc(info.title)}</strong><small>${esc(info.note)}</small></div><button class="template-add" type="button" data-template="${info.id}" title="Добавить слайд" aria-label="Добавить ${esc(info.title)}">${icon('plus')}</button></div>`;
        $('.template-preview', card).append(createSlideDOM(buildTemplate(info.id)));
        list.append(card);
      });
      state.customTemplates.forEach(info => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `<div class="template-preview" data-template="${esc(info.id)}" title="Добавить шаблон"><span class="template-badge">ВАШ</span></div><div class="template-meta"><div><strong>${esc(info.title)}</strong><small>Загруженный шаблон · фоновое изображение</small></div><button class="template-add" type="button" data-template="${esc(info.id)}" title="Добавить слайд" aria-label="Добавить ${esc(info.title)}">${icon('plus')}</button></div>`;
        $('.template-preview', card).append(createSlideDOM(slide(info.title, '#ffffff', [Object.assign(image('', 0, 0, WIDTH, HEIGHT), { assetId: info.assetId })])));
        list.append(card);
      });
      requestAnimationFrame(() => $$('.template-preview', panel).forEach(preview => {
        $('.mini-canvas', preview).style.transform = `scale(${preview.clientWidth / WIDTH})`;
      }));
      return;
    }
    if (state.ui.panel === 'projects') {
      panel.innerHTML = `<div class="panel-eyebrow">ВАША РАБОТА</div><h1 class="panel-title">Проекты</h1><p class="panel-description">Презентации сохраняются только в этом браузере. Для переноса скачайте проект.</p><button class="panel-action" data-action="new-project" type="button">${icon('plus')} Создать презентацию</button><button class="folder-add" type="button" data-action="download-project">${icon('download')} Скачать проект JSON</button><button class="folder-add" type="button" data-action="open-project">${icon('folder')} Открыть проект JSON</button><div class="panel-section-title">Недавние проекты</div><div class="project-list"></div>`;
      const list = $('.project-list', panel);
      state.projects.slice().sort((a, b) => b.updatedAt - a.updatedAt).forEach(item => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `project-card${item.id === project().id ? ' active' : ''}`;
        card.dataset.projectId = item.id;
        card.innerHTML = `<span class="project-card-icon">${icon('templates')}</span><span class="project-card-text"><strong>${esc(item.title)}</strong><small>${item.slides.length} ${item.slides.length === 1 ? 'слайд' : 'слайда(ов)'} · локально</small></span>${icon('chevron')}`;
        list.append(card);
      });
      if (state.projects.length > 1) panel.insertAdjacentHTML('beforeend', `<button class="folder-add" type="button" data-action="delete-project">${icon('trash')} Удалить текущий проект</button>`);
      return;
    }
    const bank = state.ui.panel;
    const isPartner = bank === 'partners';
    const folderId = folderFor(bank);
    const items = state.assets.filter(asset => asset.bank === bank && (folderId === 'all' || asset.folderId === folderId));
    const folders = bankFolders(bank);
    panel.innerHTML = `<div class="panel-eyebrow">${isPartner ? 'ФИРМЕННЫЕ ЭЛЕМЕНТЫ' : 'МЕДИАТЕКА'}</div><h1 class="panel-title">${isPartner ? 'Партнёры' : 'Картинки'}</h1><p class="panel-description">${isPartner ? 'Категории для логотипов и элементов партнёров. Демо-карточки можно заменить своими.' : 'Загружайте и раскладывайте изображения по папкам. Перетащите карточку на слайд.'}</p><button class="panel-action" type="button" data-action="upload">${icon('plus')} Загрузить изображение</button><div class="folder-list"><button class="folder-row ${folderId === 'all' ? 'active' : ''}" data-folder-id="all" type="button">${icon('grid')}<span>Все изображения</span><small>${state.assets.filter(item => item.bank === bank).length}</small></button></div><button class="folder-add" data-action="new-folder" type="button">${icon('plus')} Новая папка</button><div class="folder-meta"><span>${folderId === 'all' ? 'Все категории' : esc(folders.find(item => item.id === folderId)?.name || 'Категория')}</span><span>${items.length} шт.</span></div><div class="asset-grid"></div><p class="panel-description" style="margin-top:15px">PNG, JPG, WebP, GIF · не более 2 МБ за файл.</p>`;
    const list = $('.folder-list', panel);
    folders.forEach(folder => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `folder-row${folderId === folder.id ? ' active' : ''}`;
      row.dataset.folderId = folder.id;
      row.innerHTML = `${icon('folder')}<span>${esc(folder.name)}</span><small>${state.assets.filter(item => item.folderId === folder.id).length}</small>`;
      list.append(row);
    });
    if (folderId !== 'all' && !folders.find(item => item.id === folderId)?.builtin) {
      $('.folder-meta', panel).insertAdjacentHTML('afterend', `<button class="folder-add" type="button" data-action="delete-folder" style="margin:0 0 11px;padding-left:0;color:#b46c62">${icon('trash')} Удалить папку</button>`);
    }
    const grid = $('.asset-grid', panel);
    if (!items.length) {
      grid.outerHTML = `<div class="empty-state">${icon('image')}Здесь пока пусто.<br>Загрузите изображение в эту папку.</div>`;
    } else {
      items.forEach(asset => {
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.dataset.assetId = asset.id;
        card.draggable = true;
        const source = assetSource(asset.id);
        card.innerHTML = `<div class="asset-thumb"><img src="${esc(source)}" alt="${esc(asset.name)}" draggable="false"></div><span class="asset-name" title="${esc(asset.name)}">${esc(asset.name)}</span><button class="asset-menu-btn" type="button" aria-label="Действия с изображением">${icon('more')}</button>`;
        if (openAssetMenu === asset.id) {
          const popover = document.createElement('div');
          popover.className = 'asset-popover';
          popover.innerHTML = `<label for="move-${esc(asset.id)}">Переместить в папку</label><select id="move-${esc(asset.id)}" data-move-asset="${esc(asset.id)}">${folders.map(folder => `<option value="${esc(folder.id)}" ${folder.id === asset.folderId ? 'selected' : ''}>${esc(folder.name)}</option>`).join('')}</select><button data-delete-asset="${esc(asset.id)}" type="button">Удалить изображение</button>`;
          card.append(popover);
        }
        grid.append(card);
      });
    }
  }

  function paletteHtml(property, value) {
    return `<div class="palette">${COLORS.map(tone => `<button type="button" class="swatch ${tone.toLowerCase() === String(value).toLowerCase() ? 'active' : ''}" data-palette="${property}" data-color="${tone}" style="background:${tone}" aria-label="Цвет ${tone}" title="${tone}"></button>`).join('')}</div>`;
  }

  function propertyField(label, content) {
    return `<div class="field"><label>${label}</label>${content}</div>`;
  }

  function shapeChoices(property, value) {
    return `<div class="shape-choice-grid">${SHAPES.map(option => `<button type="button" class="shape-choice ${shapeKind(value) === option.id ? 'active' : ''}" data-shape-choice="${property}" data-kind="${option.id}" aria-pressed="${shapeKind(value) === option.id}">${shapePreview(option.id)}<span>${option.label}</span></button>`).join('')}</div>`;
  }

  function toggleControl(property, label, enabled) {
    return `<label class="property-toggle"><span>${label}</span><input type="checkbox" data-prop="${property}" ${enabled ? 'checked' : ''}><span class="toggle-track" aria-hidden="true"></span></label>`;
  }

  function colorControl(property, value) {
    return `${paletteHtml(property, value)}<label class="custom-color"><span>Свой цвет</span><input type="color" data-custom-color="${property}" value="${color(value)}" aria-label="Свой цвет"></label>`;
  }

  function strokeControls(element) {
    const enabled = element.strokeEnabled === true;
    return `<div class="property-section"><h3>Обводка</h3>${toggleControl('strokeEnabled', 'Включить обводку', enabled)}${enabled ? `${propertyField('Цвет линии', colorControl('strokeColor', element.strokeColor || '#1c2b22'))}${propertyField('Толщина, px', `<input type="number" min="1" max="32" data-prop="strokeWidth" value="${bounded(element.strokeWidth, 4, 1, 32)}">`)}` : ''}</div>`;
  }

  function renderInspector() {
    const target = $('#inspector-content');
    const selected = currentElement();
    if (!selected) {
      target.innerHTML = `<div class="inspector-inner"><div class="inspector-eyebrow">НАСТРОЙКИ</div><h2>Слайд</h2><p class="inspector-sub">Выберите элемент на холсте, чтобы настроить его.</p><div class="property-section"><h3>Основное</h3>${propertyField('Название слайда', `<input data-slide-prop="name" value="${esc(currentSlide().name)}" maxlength="70">`)}${propertyField('Фон слайда', paletteHtml('slide-background', currentSlide().background))}</div><div class="property-section"><h3>Действия</h3><div class="inspector-actions"><button type="button" data-action="duplicate-slide">Дублировать</button><button type="button" class="danger" data-action="delete-slide">Удалить</button></div></div><div class="tip-card"><strong>Совет по работе</strong>Картинки и элементы партнёров перетаскиваются из библиотеки прямо на слайд. На телефоне просто нажмите на карточку.</div></div>`;
      return;
    }
    const typeLabel = { text: 'Текст', shape: 'Фигура', image: 'Изображение' }[selected.type];
    let controls = '';
    if (selected.type === 'text') {
      controls += `<div class="property-section"><h3>Содержание</h3>${propertyField('Текст', `<textarea data-prop="text">${esc(selected.text)}</textarea>`)}</div>`;
      controls += `<div class="property-section"><h3>Типографика</h3>${propertyField('Шрифт', `<select data-prop="font">${FONTS.map(option => `<option ${font(selected.font) === option ? 'selected' : ''}>${option}</option>`).join('')}</select>`)}<div class="field-row">${propertyField('Размер, px', `<input type="number" min="10" max="180" data-prop="size" value="${selected.size}">`)}${propertyField('Начертание', `<select data-prop="weight"><option value="400" ${selected.weight === 400 ? 'selected' : ''}>Обычное</option><option value="700" ${selected.weight === 700 ? 'selected' : ''}>Полужирное</option><option value="800" ${selected.weight === 800 ? 'selected' : ''}>Жирное</option></select>`)}</div>${propertyField('Выравнивание', `<select data-prop="align"><option value="left" ${selected.align === 'left' ? 'selected' : ''}>Слева</option><option value="center" ${selected.align === 'center' ? 'selected' : ''}>По центру</option><option value="right" ${selected.align === 'right' ? 'selected' : ''}>Справа</option></select>`)}${propertyField('Цвет текста', paletteHtml('color', selected.color))}</div>`;
    } else if (selected.type === 'shape') {
      controls += `<div class="property-section"><h3>Форма</h3>${propertyField('Выберите фигуру', shapeChoices('shapeKind', selected.shapeKind))}${shapeKind(selected.shapeKind) !== 'ellipse' ? propertyField('Скругление углов, px', `<input type="number" min="0" max="400" data-prop="radius" value="${bounded(selected.radius, 0, 0, 400)}">`) : ''}</div>`;
      controls += `<div class="property-section"><h3>Заливка</h3>${toggleControl('fillEnabled', 'Включить заливку', selected.fillEnabled !== false)}${selected.fillEnabled !== false ? propertyField('Цвет заливки', colorControl('fill', selected.fill)) : ''}</div>`;
      controls += strokeControls(selected);
    } else {
      const cropShape = shapeKind(selected.cropShape);
      controls += `<div class="property-section"><h3>Кадрирование</h3>${propertyField('Фигура кадра', shapeChoices('cropShape', cropShape))}${cropShape !== 'ellipse' ? propertyField('Скругление углов, px', `<input type="number" min="0" max="400" data-prop="cropRadius" value="${bounded(selected.cropRadius, 0, 0, 400)}">`) : ''}${cropShape === 'rect' ? propertyField('Отображение', `<select data-prop="fit"><option value="contain" ${selected.fit !== 'cover' ? 'selected' : ''}>Показать целиком</option><option value="cover" ${selected.fit === 'cover' ? 'selected' : ''}>Заполнить область</option></select>`) : ''}${propertyField('Масштаб', `<input type="range" min="1" max="3" step="0.1" data-prop="cropZoom" value="${bounded(selected.cropZoom, 1, 1, 3)}"><span class="range-value">×${bounded(selected.cropZoom, 1, 1, 3).toFixed(1)}</span>`)}${propertyField('По горизонтали', `<input type="range" min="0" max="100" data-prop="cropX" value="${bounded(selected.cropX, 50, 0, 100)}"><span class="range-value">${bounded(selected.cropX, 50, 0, 100)}%</span>`)}${propertyField('По вертикали', `<input type="range" min="0" max="100" data-prop="cropY" value="${bounded(selected.cropY, 50, 0, 100)}"><span class="range-value">${bounded(selected.cropY, 50, 0, 100)}%</span>`)}<p class="inspector-sub">Выберите фигуру и настройте видимую часть изображения.</p></div>`;
      controls += strokeControls(selected);
    }
    const position = `<div class="property-section"><h3>Размер и положение</h3><div class="field-row">${propertyField('X', `<input type="number" data-prop="x" value="${Math.round(selected.x)}">`)}${propertyField('Y', `<input type="number" data-prop="y" value="${Math.round(selected.y)}">`)}</div><div class="field-row">${propertyField('Ширина', `<input type="number" min="30" data-prop="w" value="${Math.round(selected.w)}">`)}${propertyField('Высота', `<input type="number" min="30" data-prop="h" value="${Math.round(selected.h)}">`)}</div></div>`;
    target.innerHTML = `<div class="inspector-inner"><div class="inspector-eyebrow">ВЫБРАН ЭЛЕМЕНТ</div><h2>${typeLabel}</h2><p class="inspector-sub">Перемещайте по слайду мышью.</p>${controls}${position}<div class="property-section"><h3>Действия</h3><div class="inspector-actions"><button type="button" data-action="duplicate-element">Дублировать</button><button type="button" class="danger" data-action="delete-element">Удалить</button></div></div></div>`;
  }

  function selectElement(elementId) {
    selectedElementId = elementId;
    $$('.slide-element.selected', $('#slide-canvas')).forEach(node => {
      node.classList.remove('selected');
      $('.resize-handle', node)?.remove();
    });
    const node = $(`.slide-element[data-id="${CSS.escape(elementId)}"]`, $('#slide-canvas'));
    if (node) {
      node.classList.add('selected');
      if (!$('.resize-handle', node)) {
        const handle = document.createElement('span');
        handle.className = 'resize-handle';
        node.append(handle);
      }
    }
    renderInspector();
  }

  function startPointer(event, element, node) {
    if (event.button !== 0 || event.target.closest('[contenteditable="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    selectElement(element.id);
    const resizing = !!event.target.closest('.resize-handle');
    const start = { pointerX: event.clientX, pointerY: event.clientY, x: element.x, y: element.y, w: element.w, h: element.h };
    let changed = false;
    node.setPointerCapture(event.pointerId);
    const move = moveEvent => {
      const dx = (moveEvent.clientX - start.pointerX) / currentScale;
      const dy = (moveEvent.clientY - start.pointerY) / currentScale;
      if (Math.abs(dx) + Math.abs(dy) < 2) return;
      changed = true;
      if (resizing) {
        node.style.width = `${clamp(start.w + dx, 30, WIDTH - start.x)}px`;
        node.style.height = `${clamp(start.h + dy, 30, HEIGHT - start.y)}px`;
      } else {
        node.style.left = `${clamp(start.x + dx, 0, WIDTH - start.w)}px`;
        node.style.top = `${clamp(start.y + dy, 0, HEIGHT - start.h)}px`;
      }
    };
    const end = () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', end);
      node.removeEventListener('pointercancel', end);
      if (!changed) return;
      remember();
      if (resizing) {
        element.w = Math.round(parseFloat(node.style.width));
        element.h = Math.round(parseFloat(node.style.height));
      } else {
        element.x = Math.round(parseFloat(node.style.left));
        element.y = Math.round(parseFloat(node.style.top));
      }
      save();
      renderFilmstrip();
      renderInspector();
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
  }

  function editText(element, node) {
    selectElement(element.id);
    const content = $('.text-content', node);
    content.contentEditable = 'true';
    content.focus();
    const range = document.createRange();
    range.selectNodeContents(content);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const finish = () => {
      const next = content.innerText.replace(/\n$/, '');
      content.contentEditable = 'false';
      if (next !== element.text) {
        remember();
        element.text = next;
        save();
        renderFilmstrip();
        renderInspector();
      }
    };
    content.addEventListener('blur', finish, { once: true });
    content.addEventListener('keydown', event => {
      if (event.key === 'Escape') content.blur();
      event.stopPropagation();
    });
  }

  function openModal({ title, message, placeholder, confirmText = 'Готово', danger = false, onConfirm }) {
    const backdrop = $('#modal-backdrop');
    $('#modal').innerHTML = `<h2>${esc(title)}</h2><p>${esc(message)}</p>${placeholder !== undefined ? `<input id="modal-input" placeholder="${esc(placeholder)}" maxlength="80">` : ''}<div class="modal-actions"><button type="button" class="button button-ghost" data-modal="cancel">Отмена</button><button type="button" class="button ${danger ? 'button-ghost' : 'button-primary'}" style="${danger ? 'color:#b14646' : ''}" data-modal="confirm">${esc(confirmText)}</button></div>`;
    backdrop.classList.remove('hidden');
    const input = $('#modal-input');
    if (input) input.focus();
    const close = () => { backdrop.classList.add('hidden'); backdrop.onclick = null; backdrop.onkeydown = null; };
    backdrop.onclick = event => {
      if (event.target === backdrop || event.target.closest('[data-modal="cancel"]')) close();
      if (event.target.closest('[data-modal="confirm"]')) {
        const value = input?.value.trim();
        if (input && !value) { input.focus(); return; }
        close();
        onConfirm(value);
      }
    };
    backdrop.onkeydown = event => {
      if (event.key === 'Escape') close();
      if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('[data-modal="confirm"]', backdrop).click(); }
    };
  }

  function addReferenceDeck() {
    remember();
    const pages = REFERENCE_SLIDES.map((_, index) => referenceSlide(index));
    const index = project().slides.findIndex(item => item.id === state.selectedSlideId);
    project().slides.splice(index + 1, 0, ...pages);
    state.selectedSlideId = pages[0].id;
    selectedElementId = null;
    save(); renderAll();
    $(`.slide-tile[data-slide-id="${pages[0].id}"]`, $('#filmstrip'))?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    showToast('11 слайдов образца добавлены');
  }

  function addSlide(kind = 'blank') {
    remember();
    const custom = state.customTemplates.find(item => item.id === kind);
    const next = custom ? slide(custom.title, '#ffffff', [Object.assign(image('', 0, 0, WIDTH, HEIGHT), { assetId: custom.assetId })]) : buildTemplate(kind);
    const index = project().slides.findIndex(item => item.id === state.selectedSlideId);
    project().slides.splice(index + 1, 0, next);
    state.selectedSlideId = next.id;
    selectedElementId = null;
    save();
    renderAll();
    $(`.slide-tile[data-slide-id="${next.id}"]`, $('#filmstrip'))?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    showToast(kind === 'blank' ? 'Новый слайд добавлен' : 'Шаблон добавлен как новый слайд');
  }

  function addText() {
    remember();
    const element = text('Ваш текст', 180, 240, 720, 160, 62, '#1c2b22', 700, 'Montserrat');
    currentSlide().elements.push(element);
    selectedElementId = element.id;
    save();
    renderCanvas(); renderFilmstrip(); renderInspector();
  }

  function addShape(kind = 'rect') {
    remember();
    const chosen = shapeKind(kind);
    const element = chosen === 'rect' ? shape(260, 290, 450, 250, '#50b848', 24, chosen) : shape(330, 260, 330, 330, '#50b848', 0, chosen);
    currentSlide().elements.push(element);
    selectedElementId = element.id;
    save();
    renderCanvas(); renderFilmstrip(); renderInspector();
  }

  function closeShapeMenu() {
    $('#shape-menu').classList.add('hidden');
    $('#add-shape').setAttribute('aria-expanded', 'false');
  }

  function deleteSelectedElement() {
    if (!currentElement()) return;
    remember();
    currentSlide().elements = currentSlide().elements.filter(item => item.id !== selectedElementId);
    selectedElementId = null;
    save(); renderCanvas(); renderFilmstrip(); renderInspector();
  }

  function action(name) {
    if (name === 'duplicate-element' && currentElement()) {
      remember();
      const duplicate = clone(currentElement());
      duplicate.id = uid();
      duplicate.x = clamp(duplicate.x + 36, 0, WIDTH - duplicate.w);
      duplicate.y = clamp(duplicate.y + 36, 0, HEIGHT - duplicate.h);
      currentSlide().elements.push(duplicate);
      selectedElementId = duplicate.id;
      save(); renderCanvas(); renderFilmstrip(); renderInspector();
    } else if (name === 'delete-element') deleteSelectedElement();
    else if (name === 'duplicate-slide') {
      remember();
      const copy = clone(currentSlide());
      copy.id = uid(); copy.name = `${copy.name} — копия`;
      copy.elements.forEach(item => { item.id = uid(); });
      project().slides.splice(project().slides.indexOf(currentSlide()) + 1, 0, copy);
      state.selectedSlideId = copy.id;
      selectedElementId = null;
      save(); renderAll();
    } else if (name === 'delete-slide') {
      if (project().slides.length === 1) return showToast('В презентации должен остаться хотя бы один слайд');
      openModal({ title: 'Удалить слайд?', message: 'Это действие удалит выбранный слайд из презентации.', confirmText: 'Удалить', danger: true, onConfirm: () => {
        remember();
        const index = project().slides.findIndex(item => item.id === state.selectedSlideId);
        project().slides.splice(index, 1);
        state.selectedSlideId = project().slides[Math.max(0, index - 1)].id;
        selectedElementId = null;
        save(); renderAll();
      }});
    }
  }

  function setProperty(property, raw, slideProperty = false) {
    if (slideProperty) {
      if (property !== 'name') return;
      const next = String(raw).trim().slice(0, 70) || 'Без названия';
      if (next === currentSlide().name) return;
      remember(); currentSlide().name = next;
    } else {
      const element = currentElement();
      const shapeProperties = ['shapeKind', 'fillEnabled', 'strokeEnabled', 'strokeWidth'];
      const imageProperties = ['cropShape', 'cropRadius', 'cropZoom', 'cropX', 'cropY', 'strokeEnabled', 'strokeWidth'];
      if (!element || (!(property in element) && !(element.type === 'shape' && shapeProperties.includes(property)) && !(element.type === 'image' && imageProperties.includes(property)))) return;
      let next = raw;
      if (['x', 'y', 'w', 'h', 'size', 'radius', 'cropRadius', 'cropZoom', 'cropX', 'cropY', 'strokeWidth', 'weight'].includes(property)) {
        next = Number(raw);
        if (!Number.isFinite(next)) return;
        if (property === 'size') next = clamp(next, 10, 180);
        if (property === 'radius' || property === 'cropRadius') next = clamp(next, 0, 400);
        if (property === 'cropZoom') next = clamp(next, 1, 3);
        if (property === 'cropX' || property === 'cropY') next = clamp(next, 0, 100);
        if (property === 'strokeWidth') next = clamp(next, 1, 32);
        if (property === 'w') next = clamp(next, 30, WIDTH - element.x);
        if (property === 'h') next = clamp(next, 30, HEIGHT - element.y);
        if (property === 'x') next = clamp(next, 0, WIDTH - element.w);
        if (property === 'y') next = clamp(next, 0, HEIGHT - element.h);
        if (property === 'weight') next = [400,700,800].includes(next) ? next : 400;
      }
      if (property === 'font') next = font(raw);
      if (property === 'fillEnabled' || property === 'strokeEnabled') next = raw === true;
      if (property === 'shapeKind' || property === 'cropShape') next = shapeKind(raw);
      if (property === 'align' && !['left','center','right'].includes(next)) return;
      if (property === 'fit' && !['contain','cover'].includes(next)) return;
      if (element[property] === next) return;
      remember(); element[property] = next;
      if (property === 'cropShape' && next !== 'rect') element.fit = 'cover';
    }
    save(); renderCanvas(); renderFilmstrip(); renderInspector();
  }

  function setPalette(property, tone) {
    if (!/^#[0-9a-fA-F]{6}$/.test(tone)) return;
    if (property === 'slide-background') {
      if (currentSlide().background === tone) return;
      remember(); currentSlide().background = tone;
    } else {
      const element = currentElement();
      if (!element || !((property === 'color' && element.type === 'text') || (property === 'fill' && element.type === 'shape') || (property === 'strokeColor' && ['shape', 'image'].includes(element.type)))) return;
      if (element[property] === tone) return;
      remember(); element[property] = tone;
    }
    save(); renderCanvas(); renderFilmstrip(); renderInspector();
  }

  function createProject(name) {
    const next = { id: uid(), title: name || 'Новая презентация', slides: [buildTemplate('blank')], updatedAt: Date.now() };
    state.projects.push(next);
    state.activeProjectId = next.id;
    state.selectedSlideId = next.slides[0].id;
    selectedElementId = null;
    history = []; future = [];
    save(); renderAll();
    showToast('Презентация создана');
  }

  function deleteProject() {
    if (state.projects.length <= 1) return;
    openModal({ title: 'Удалить презентацию?', message: `Проект «${project().title}» и все его слайды будут удалены.`, confirmText: 'Удалить', danger: true, onConfirm: () => {
      state.projects = state.projects.filter(item => item.id !== state.activeProjectId);
      state.activeProjectId = state.projects[0].id;
      state.selectedSlideId = project().slides[0].id;
      selectedElementId = null;
      history = []; future = [];
      save(); renderAll(); showToast('Проект удалён');
    }});
  }

  function createFolder(bank, name) {
    const folder = { id: uid(), bank, name, builtin: false };
    state.folders.push(folder);
    state.ui[bank === 'images' ? 'imageFolder' : 'partnerFolder'] = folder.id;
    save(); renderPanel(); showToast('Папка создана');
  }

  function deleteFolder(bank) {
    const id = folderFor(bank);
    const folder = state.folders.find(item => item.id === id);
    if (!folder || folder.builtin) return;
    openModal({ title: 'Удалить папку?', message: 'Изображения из неё будут перенесены в первую категорию.', confirmText: 'Удалить папку', danger: true, onConfirm: () => {
      const fallback = bankFolders(bank).find(item => item.builtin && item.id !== id)?.id;
      state.assets.filter(item => item.folderId === id).forEach(item => { item.folderId = fallback; });
      state.folders = state.folders.filter(item => item.id !== id);
      state.ui[bank === 'images' ? 'imageFolder' : 'partnerFolder'] = 'all';
      save(); renderPanel(); showToast('Папка удалена');
    }});
  }

  function addAssetToSlide(assetId, position) {
    const source = assetSource(assetId);
    if (!source) return showToast('Не удалось открыть изображение');
    const probe = new Image();
    probe.onload = () => {
      const ratio = probe.naturalWidth / probe.naturalHeight || 1;
      const width = ratio > 2 ? 500 : ratio < .7 ? 260 : 400;
      const height = clamp(width / ratio, 110, 440);
      const x = clamp(Math.round((position?.x ?? WIDTH / 2) - width / 2), 0, WIDTH - width);
      const y = clamp(Math.round((position?.y ?? HEIGHT / 2) - height / 2), 0, HEIGHT - height);
      remember();
      const element = { id: uid(), type: 'image', assetId, x, y, w: width, h: Math.round(height), fit: 'contain' };
      currentSlide().elements.push(element);
      selectedElementId = element.id;
      save(); renderCanvas(); renderFilmstrip(); renderInspector();
    };
    probe.onerror = () => showToast('Изображение повреждено или недоступно');
    probe.src = source;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open('centrinvest-studio-assets', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('files', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function dbAction(mode, method, value) {
    return new Promise((resolve, reject) => {
      const request = database.transaction('files', mode).objectStore('files')[method](value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function loadAssetUrls() {
    try {
      database = await openDatabase();
      const stored = await dbAction('readonly', 'getAll');
      stored.forEach(item => {
        if (state.assets.some(asset => asset.id === item.id)) objectUrls.set(item.id, URL.createObjectURL(item.blob));
      });
      if (['images', 'partners', 'templates'].includes(state.ui.panel)) renderPanel();
      renderCanvas(); renderFilmstrip();
    } catch (_) {
      showToast('Браузер не разрешил хранить изображения. Откройте страницу через локальный сервер.');
    }
  }

  async function uploadFiles(files, bank, folderId, position) {
    if (!database) return showToast('Хранилище изображений недоступно в этом режиме браузера');
    let accepted = 0;
    let rejected = 0;
    for (const file of files) {
      if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > LIMIT || !file.size) { rejected++; continue; }
      const asset = { id: uid(), bank, folderId, name: file.name.replace(/\.[^.]+$/, '').slice(0, 70) || 'Изображение', builtin: false };
      try {
        await dbAction('readwrite', 'put', { id: asset.id, blob: file });
        objectUrls.set(asset.id, URL.createObjectURL(file));
        state.assets.push(asset);
        accepted++;
        if (position) addAssetToSlide(asset.id, { x: position.x + (accepted - 1) * 35, y: position.y + (accepted - 1) * 35 });
      } catch (_) { rejected++; }
    }
    save(); renderPanel();
    if (rejected) showToast(`${rejected} файл(ов) не добавлено: нужен PNG/JPG/WebP/GIF до 2 МБ`);
    else if (accepted) showToast(`${accepted} изображени${accepted === 1 ? 'е' : 'й'} добавлено`);
  }

  function deleteAsset(assetId) {
    const asset = state.assets.find(item => item.id === assetId);
    if (!asset) return;
    const used = state.projects.reduce((count, item) => count + item.slides.reduce((sum, page) => sum + page.elements.filter(element => element.assetId === assetId).length, 0), 0);
    openModal({ title: 'Удалить изображение?', message: used ? `Оно используется на слайдах (${used} раз). Эти элементы тоже будут удалены.` : 'Изображение будет удалено из библиотеки.', confirmText: 'Удалить', danger: true, onConfirm: async () => {
      state.projects.forEach(item => item.slides.forEach(page => { page.elements = page.elements.filter(element => element.assetId !== assetId); }));
      state.assets = state.assets.filter(item => item.id !== assetId);
      state.customTemplates = state.customTemplates.filter(item => item.assetId !== assetId);
      if (!asset.builtin && database) await dbAction('readwrite', 'delete', assetId).catch(() => {});
      if (objectUrls.has(assetId)) URL.revokeObjectURL(objectUrls.get(assetId));
      objectUrls.delete(assetId);
      openAssetMenu = null;
      history = []; future = [];
      if (selectedElementId && !currentElement()) selectedElementId = null;
      save(); renderAll(); showToast('Изображение удалено');
    }});
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function readDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function exportJson() {
    const stored = database ? await dbAction('readonly', 'getAll') : [];
    const embeddedAssets = [];
    for (const item of stored) {
      if (state.assets.some(asset => asset.id === item.id)) embeddedAssets.push({ id: item.id, data: await readDataUrl(item.blob) });
    }
    const payload = { app: 'centrinvest-studio', version: 1, project: clone(project()), folders: clone(state.folders), assets: clone(state.assets), embeddedAssets };
    const filename = `${project().title.replace(/[\\/:*?"<>|]/g, '').slice(0, 50) || 'prezentatsiya'}.json`;
    downloadFile(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
    showToast('Файл проекта скачан');
  }

  function dataUrlToBlob(value) {
    const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(value);
    if (!match || match[2].length > 2800000) throw new Error('Некорректное изображение');
    const bytes = Uint8Array.from(atob(match[2]), char => char.charCodeAt(0));
    if (bytes.length > LIMIT || !bytes.length) throw new Error('Изображение превышает 2 МБ');
    return new Blob([bytes], { type: match[1] });
  }

  async function importJson(file) {
    try {
      const payload = JSON.parse(await file.text());
      if (payload.app !== 'centrinvest-studio' || payload.version !== 1 || !Array.isArray(payload.project?.slides) || !payload.project.slides.length || payload.project.slides.length > 200 || !Array.isArray(payload.assets) || !Array.isArray(payload.folders)) throw new Error('Неверный формат проекта');
      const imported = clone(payload.project);
      imported.id = uid();
      imported.title = String(imported.title || 'Импортированная презентация').slice(0, 90);
      imported.updatedAt = Date.now();
      imported.slides = imported.slides.map(page => {
        if (!Array.isArray(page.elements) || page.elements.length > 250) throw new Error('Слишком много элементов');
        return {
          id: String(page.id || uid()), name: String(page.name || 'Слайд').slice(0, 70), background: color(page.background),
          elements: page.elements.map(item => {
            if (!['text','shape','image'].includes(item.type)) throw new Error('Неизвестный элемент');
            const output = { id: String(item.id || uid()), type: item.type, x: clamp(Number(item.x) || 0, 0, WIDTH), y: clamp(Number(item.y) || 0, 0, HEIGHT), w: clamp(Number(item.w) || 100, 30, WIDTH), h: clamp(Number(item.h) || 100, 30, HEIGHT) };
            if (item.type === 'text') Object.assign(output, { text: String(item.text || '').slice(0, 10000), size: clamp(Number(item.size) || 24, 10, 180), color: color(item.color), weight: [400,700,800].includes(Number(item.weight)) ? Number(item.weight) : 400, font: font(item.font), align: ['left','center','right'].includes(item.align) ? item.align : 'left' });
            if (item.type === 'shape') Object.assign(output, { fill: color(item.fill), radius: bounded(item.radius, 0, 0, 400), shapeKind: shapeKind(item.shapeKind), fillEnabled: item.fillEnabled !== false, strokeEnabled: item.strokeEnabled === true, strokeColor: color(item.strokeColor || '#1c2b22'), strokeWidth: bounded(item.strokeWidth, 4, 1, 32) });
            if (item.type === 'image') Object.assign(output, { assetId: item.assetId ? String(item.assetId) : undefined, src: /^assets\/[a-z-]+\.svg$/.test(item.src || '') ? item.src : undefined, fit: item.fit === 'cover' || shapeKind(item.cropShape) !== 'rect' ? 'cover' : 'contain', cropShape: shapeKind(item.cropShape), cropRadius: bounded(item.cropRadius, 0, 0, 400), cropZoom: bounded(item.cropZoom, 1, 1, 3), cropX: bounded(item.cropX, 50, 0, 100), cropY: bounded(item.cropY, 50, 0, 100), strokeEnabled: item.strokeEnabled === true, strokeColor: color(item.strokeColor || '#1c2b22'), strokeWidth: bounded(item.strokeWidth, 4, 1, 32) });
            return output;
          })
        };
      });
      if (!database && (payload.embeddedAssets || []).length) throw new Error('Хранилище изображений недоступно');
      for (const item of payload.embeddedAssets || []) {
        const blob = dataUrlToBlob(item.data);
        if (!state.assets.some(asset => asset.id === item.id)) {
          await dbAction('readwrite', 'put', { id: String(item.id), blob });
          objectUrls.set(String(item.id), URL.createObjectURL(blob));
        }
      }
      payload.folders.forEach(item => {
        if (!state.folders.some(folder => folder.id === item.id) && ['images','partners'].includes(item.bank)) state.folders.push({ id: String(item.id), bank: item.bank, name: String(item.name).slice(0, 80), builtin: false });
      });
      payload.assets.forEach(item => {
        if (!state.assets.some(asset => asset.id === item.id) && ['images','partners'].includes(item.bank)) state.assets.push({ id: String(item.id), bank: item.bank, folderId: String(item.folderId), name: String(item.name).slice(0, 80), src: /^assets\/[a-z-]+\.svg$/.test(item.src || '') ? item.src : undefined, builtin: !!item.builtin });
      });
      state.projects.push(imported);
      state.activeProjectId = imported.id;
      state.selectedSlideId = imported.slides[0].id;
      state.ui.panel = 'projects';
      selectedElementId = null; history = []; future = [];
      save(); renderAll(); showToast('Проект открыт');
    } catch (error) {
      showToast(`Не удалось открыть проект: ${error.message}`);
    }
  }

  async function exportDocument(format) {
    if (!['pdf', 'pptx', 'odp'].includes(format)) return;
    try {
      showToast('Готовлю файл презентации…');
      const blob = await StudioFormats.exportSlides(format, project().slides, assetSource, shapePath);
      downloadFile(blob, `${project().title.replace(/[\/:*?"<>|]/g, '_').slice(0, 60) || 'Презентация'}.${format}`);
      showToast(`${format.toUpperCase()} скачан`);
    } catch (error) { showToast(`Не удалось экспортировать: ${error.message}`); }
  }

  async function importTemplate(file) {
    if (!database) return showToast('Хранилище шаблонов недоступно в этом браузере');
    const created = [];
    try {
      showToast('Читаю страницы шаблона…');
      const pages = await StudioFormats.importPages(file);
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 48) || 'Шаблон';
      for (const [index, blob] of pages.entries()) {
        const assetId = uid();
        await dbAction('readwrite', 'put', { id: assetId, blob });
        objectUrls.set(assetId, URL.createObjectURL(blob));
        state.assets.push({ id: assetId, bank: 'images', folderId: 'img-other', name: `${name} ${index + 1}`, builtin: false });
        state.customTemplates.push({ id: uid(), assetId, title: `${name} · ${index + 1}` });
        created.push(assetId);
      }
      save(); renderPanel();
      showToast('Страницы шаблона загружены. Нажмите на карточку, чтобы добавить слайд.');
    } catch (error) {
      for (const assetId of created) {
        await dbAction('readwrite', 'delete', assetId).catch(() => {});
        URL.revokeObjectURL(objectUrls.get(assetId));
        objectUrls.delete(assetId);
      }
      state.assets = state.assets.filter(item => !created.includes(item.id));
      state.customTemplates = state.customTemplates.filter(item => !created.includes(item.assetId));
      showToast(`Не удалось загрузить шаблон: ${error.message}`);
    }
  }

  function printSlides() {
    const pages = $('#print-pages');
    pages.replaceChildren();
    project().slides.forEach(item => {
      const page = document.createElement('div');
      page.className = 'print-page';
      page.append(createSlideDOM(item, 'slide-canvas'));
      pages.append(page);
    });
    setTimeout(() => window.print(), 150);
    showToast('В окне печати выберите «Сохранить как PDF»');
  }

  function renderPresentation() {
    const page = project().slides[presentationIndex];
    if (!page) return;
    const scale = Math.min((window.innerWidth - 36) / WIDTH, (window.innerHeight - 90) / HEIGHT);
    const holder = document.createElement('div');
    holder.style.cssText = `position:relative;width:${WIDTH * scale}px;height:${HEIGHT * scale}px;background:white;box-shadow:0 20px 70px #0006;`;
    const content = createSlideDOM(page, 'slide-canvas');
    content.style.transform = `scale(${scale})`;
    holder.append(content);
    $('#presentation-slide').replaceChildren(holder);
    $('#presentation-counter').textContent = `${presentationIndex + 1} / ${project().slides.length}`;
    $('#presentation-prev').disabled = presentationIndex === 0;
    $('#presentation-next').disabled = presentationIndex === project().slides.length - 1;
  }

  function showPresentation() {
    presentationIndex = Math.max(0, project().slides.findIndex(item => item.id === state.selectedSlideId));
    $('#presentation').classList.remove('hidden');
    renderPresentation();
  }

  function closePresentation() { $('#presentation').classList.add('hidden'); }

  $('#project-title').addEventListener('change', event => {
    project().title = event.target.value.trim().slice(0, 90) || 'Новая презентация';
    save(); renderPanel();
  });
  $('#present-btn').addEventListener('click', showPresentation);
  $('#add-text').addEventListener('click', addText);
  $('#shape-menu').innerHTML = `<span class="shape-menu-title">Добавить фигуру</span>${SHAPES.map(option => `<button type="button" role="menuitem" data-add-shape="${option.id}">${shapePreview(option.id)}<span>${option.label}</span></button>`).join('')}`;
  $('#add-shape').addEventListener('click', () => {
    const menu = $('#shape-menu');
    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !willOpen);
    $('#add-shape').setAttribute('aria-expanded', String(willOpen));
    if (willOpen) $('button', menu).focus();
  });
  $('#shape-menu').addEventListener('click', event => {
    const kind = event.target.closest('[data-add-shape]')?.dataset.addShape;
    if (!kind) return;
    closeShapeMenu();
    addShape(kind);
  });
  $('#add-slide').addEventListener('click', () => addSlide());
  $('#undo').addEventListener('click', () => restoreHistory(history, future));
  $('#redo').addEventListener('click', () => restoreHistory(future, history));
  $('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#properties-toggle').addEventListener('click', () => $('#inspector').classList.toggle('open'));
  $('#export-btn').addEventListener('click', () => {
    $('#export-menu').classList.toggle('hidden');
    $('#export-btn').setAttribute('aria-expanded', String(!$('#export-menu').classList.contains('hidden')));
  });
  $('#export-menu').addEventListener('click', event => {
    const choice = event.target.closest('[data-export]')?.dataset.export;
    if (!choice) return;
    $('#export-menu').classList.add('hidden');
    $('#export-btn').setAttribute('aria-expanded', 'false');
    exportDocument(choice);
  });
  $('#template-import').addEventListener('change', event => {
    if (event.target.files[0]) importTemplate(event.target.files[0]);
    event.target.value = '';
  });
  $('#project-import').addEventListener('change', event => {
    if (event.target.files[0]) importJson(event.target.files[0]);
    event.target.value = '';
  });
  $$('.rail-item').forEach(item => item.addEventListener('click', () => {
    state.ui.panel = item.dataset.panel;
    openAssetMenu = null;
    $('#sidebar').classList.remove('open');
    save(); renderAll();
  }));

  $('#library-panel').addEventListener('click', event => {
    const panel = $('#library-panel');
    if (event.target.closest('[data-template-set="offer-reference"]')) return addReferenceDeck();
    const template = event.target.closest('[data-template]');
    if (template) return addSlide(template.dataset.template);
    const command = event.target.closest('[data-action]')?.dataset.action;
    if (command === 'import-template') return $('#template-import').click();
    if (command === 'download-project') return exportJson().catch(() => showToast('Не удалось скачать проект'));
    if (command === 'open-project') return $('#project-import').click();
    if (command === 'new-project') return openModal({ title: 'Новая презентация', message: 'Как назовём ваш проект?', placeholder: 'Например, Партнёрский форум', confirmText: 'Создать', onConfirm: createProject });
    if (command === 'delete-project') return deleteProject();
    if (command === 'upload') { uploadBank = state.ui.panel; $('#asset-upload').click(); return; }
    if (command === 'new-folder') return openModal({ title: 'Новая папка', message: 'Название поможет быстро находить изображения.', placeholder: 'Название категории', confirmText: 'Создать папку', onConfirm: name => createFolder(state.ui.panel, name) });
    if (command === 'delete-folder') return deleteFolder(state.ui.panel);
    const projectCard = event.target.closest('[data-project-id]');
    if (projectCard) {
      state.activeProjectId = projectCard.dataset.projectId;
      state.selectedSlideId = project().slides[0].id;
      selectedElementId = null; history = []; future = [];
      save(); renderAll(); return;
    }
    const folder = event.target.closest('[data-folder-id]');
    if (folder) {
      state.ui[state.ui.panel === 'images' ? 'imageFolder' : 'partnerFolder'] = folder.dataset.folderId;
      openAssetMenu = null; save(); renderPanel(); return;
    }
    const card = event.target.closest('[data-asset-id]');
    if (!card) { if (openAssetMenu) { openAssetMenu = null; renderPanel(); } return; }
    const assetId = card.dataset.assetId;
    if (event.target.closest('[data-delete-asset]')) return deleteAsset(assetId);
    if (event.target.closest('.asset-popover')) return;
    if (event.target.closest('.asset-menu-btn')) {
      openAssetMenu = openAssetMenu === assetId ? null : assetId;
      renderPanel(); return;
    }
    addAssetToSlide(assetId);
    if (window.innerWidth <= 760) $('#sidebar').classList.remove('open');
  });
  $('#library-panel').addEventListener('change', event => {
    const assetId = event.target.dataset.moveAsset;
    if (!assetId) return;
    const asset = state.assets.find(item => item.id === assetId);
    if (!asset || !state.folders.some(item => item.id === event.target.value && item.bank === asset.bank)) return;
    asset.folderId = event.target.value;
    openAssetMenu = null;
    save(); renderPanel(); showToast('Изображение перемещено');
  });
  $('#library-panel').addEventListener('dragstart', event => {
    const card = event.target.closest('[data-asset-id]');
    if (!card) return;
    event.dataTransfer.setData('application/x-ci-asset', card.dataset.assetId);
    event.dataTransfer.effectAllowed = 'copyMove';
  });
  $('#library-panel').addEventListener('dragover', event => {
    if (event.target.closest('[data-folder-id]') && event.dataTransfer.types.includes('application/x-ci-asset')) event.preventDefault();
  });
  $('#library-panel').addEventListener('drop', event => {
    const folder = event.target.closest('[data-folder-id]');
    const assetId = event.dataTransfer.getData('application/x-ci-asset');
    if (!folder || !assetId) return;
    event.preventDefault();
    const asset = state.assets.find(item => item.id === assetId);
    if (!asset || folder.dataset.folderId === 'all') return;
    asset.folderId = folder.dataset.folderId;
    save(); renderPanel(); showToast('Изображение перемещено');
  });
  $('#asset-upload').addEventListener('change', event => {
    const bank = uploadBank;
    const selected = folderFor(bank);
    const folderId = selected === 'all' ? bankFolders(bank)[0]?.id : selected;
    uploadFiles([...event.target.files], bank, folderId);
    event.target.value = '';
  });

  $('#inspector').addEventListener('click', event => {
    const swatch = event.target.closest('[data-palette]');
    if (swatch) return setPalette(swatch.dataset.palette, swatch.dataset.color);
    const choice = event.target.closest('[data-shape-choice]');
    if (choice) return setProperty(choice.dataset.shapeChoice, choice.dataset.kind);
    const command = event.target.closest('[data-action]')?.dataset.action;
    if (command) action(command);
  });
  $('#inspector').addEventListener('change', event => {
    if (event.target.dataset.customColor) return setPalette(event.target.dataset.customColor, event.target.value);
    if (event.target.dataset.prop) setProperty(event.target.dataset.prop, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    if (event.target.dataset.slideProp) setProperty(event.target.dataset.slideProp, event.target.value, true);
  });
  $('#slide-canvas').addEventListener('pointerdown', event => {
    if (event.target !== $('#slide-canvas')) return;
    selectedElementId = null; renderCanvas(); renderInspector();
  });
  $('#slide-canvas').addEventListener('dragover', event => {
    if (event.dataTransfer.types.includes('application/x-ci-asset') || [...event.dataTransfer.types].includes('Files')) {
      event.preventDefault();
      $('#slide-canvas').classList.add('drag-over');
    }
  });
  $('#slide-canvas').addEventListener('dragleave', event => {
    if (!$('#slide-canvas').contains(event.relatedTarget)) $('#slide-canvas').classList.remove('drag-over');
  });
  $('#slide-canvas').addEventListener('drop', event => {
    event.preventDefault();
    $('#slide-canvas').classList.remove('drag-over');
    const rect = $('#slide-canvas').getBoundingClientRect();
    const position = { x: (event.clientX - rect.left) / currentScale, y: (event.clientY - rect.top) / currentScale };
    const assetId = event.dataTransfer.getData('application/x-ci-asset');
    if (assetId) return addAssetToSlide(assetId, position);
    if (event.dataTransfer.files.length) {
      const bank = ['images','partners'].includes(state.ui.panel) ? state.ui.panel : 'images';
      const selected = folderFor(bank);
      uploadFiles([...event.dataTransfer.files], bank, selected === 'all' ? bankFolders(bank)[0]?.id : selected, position);
    }
  });
  $('#filmstrip').addEventListener('click', event => {
    const tile = event.target.closest('[data-slide-id]');
    if (!tile) return;
    state.selectedSlideId = tile.dataset.slideId;
    selectedElementId = null;
    save(); renderCanvas(); renderFilmstrip(); renderInspector();
  });
  $('#filmstrip').addEventListener('dragstart', event => {
    const tile = event.target.closest('[data-slide-id]');
    if (tile) event.dataTransfer.setData('application/x-ci-slide', tile.dataset.slideId);
  });
  $('#filmstrip').addEventListener('dragover', event => {
    if (event.target.closest('[data-slide-id]') && event.dataTransfer.types.includes('application/x-ci-slide')) event.preventDefault();
  });
  $('#filmstrip').addEventListener('drop', event => {
    const target = event.target.closest('[data-slide-id]');
    const sourceId = event.dataTransfer.getData('application/x-ci-slide');
    if (!target || !sourceId || sourceId === target.dataset.slideId) return;
    event.preventDefault(); remember();
    const slides = project().slides;
    const sourceIndex = slides.findIndex(item => item.id === sourceId);
    const [moved] = slides.splice(sourceIndex, 1);
    slides.splice(slides.findIndex(item => item.id === target.dataset.slideId), 0, moved);
    save(); renderFilmstrip(); renderCanvas();
  });
  $('#presentation-prev').addEventListener('click', () => { presentationIndex = Math.max(0, presentationIndex - 1); renderPresentation(); });
  $('#presentation-next').addEventListener('click', () => { presentationIndex = Math.min(project().slides.length - 1, presentationIndex + 1); renderPresentation(); });
  $('#presentation-close').addEventListener('click', closePresentation);
  document.addEventListener('keydown', event => {
    if (!$('#presentation').classList.contains('hidden')) {
      if (event.key === 'Escape') closePresentation();
      if (event.key === 'ArrowRight' || event.key === ' ') { presentationIndex = Math.min(project().slides.length - 1, presentationIndex + 1); renderPresentation(); }
      if (event.key === 'ArrowLeft') { presentationIndex = Math.max(0, presentationIndex - 1); renderPresentation(); }
      return;
    }
    if (event.key === 'Escape') { closeShapeMenu(); $('#export-menu').classList.add('hidden'); $('#inspector').classList.remove('open'); $('#sidebar').classList.remove('open'); }
    if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId) { event.preventDefault(); deleteSelectedElement(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); restoreHistory(history, future); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); restoreHistory(future, history); }
  });
  window.addEventListener('resize', () => { fitCanvas(); if (!$('#presentation').classList.contains('hidden')) renderPresentation(); });
  window.addEventListener('afterprint', () => $('#print-pages').replaceChildren());
  document.addEventListener('click', event => {
    if (!event.target.closest('.export-wrap')) $('#export-menu').classList.add('hidden');
    if (!event.target.closest('.shape-tool')) closeShapeMenu();
  });

  renderAll();
  loadAssetUrls();
})();





