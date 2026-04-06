/* =========================================
   LIVE ARK ODYSSEY 2026 — V2 Main JS
   ========================================= */

(function () {
  'use strict';

  /* -----------------------------------------
     1. COUNTDOWN
     ----------------------------------------- */
  function initCountdown() {
    const el = document.getElementById('countdownDays');
    if (!el) return;

    const target = new Date('2026-08-10T00:00:00+09:00');

    function update() {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        el.textContent = '0';
        return;
      }
      el.textContent = String(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    update();
    setInterval(update, 60000);
  }

  /* -----------------------------------------
     2. SCHEDULE — Load from shows.json
     ----------------------------------------- */
  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

  // Store loaded shows for modal access
  let allShows = [];

  function formatDate(dateStr, isHoliday) {
    const d = new Date(dateStr + 'T00:00:00');
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const dowIdx = d.getDay();
    const dow = DAY_NAMES[dowIdx];
    const suffix = isHoliday ? '祝' : '';

    // Day type for colour
    let dayType = '';
    if (isHoliday) dayType = 'holiday';
    else if (dowIdx === 0) dayType = 'sun';
    else if (dowIdx === 6) dayType = 'sat';

    return { display: `${m}.${day}`, dow: `(${dow}${suffix})`, dayType };
  }

  function createScheduleItem(show) {
    const li = document.createElement('li');
    li.className = 'schedule__item';

    const { display, dow, dayType } = formatDate(show.date, show.holiday);
    const dayClass = dayType ? ` schedule__day--${dayType}` : '';

    let guestsHTML = '';
    if (show.guests && show.guests.length > 0) {
      const guestLinks = show.guests.map(g =>
        g.x_url
          ? `<a href="${g.x_url}" target="_blank" rel="noopener">${g.name}</a>`
          : g.name
      ).join(' / ');
      guestsHTML = `<span class="schedule__guests">w/ ${guestLinks}</span>`;
    }

    let soloHTML = '';
    if (show.solo) {
      soloHTML = '<span class="schedule__solo-badge">ONE MAN</span>';
    }

    li.innerHTML = `
      <div class="schedule__date-col">
        <span class="schedule__date">${display}</span>
        <span class="schedule__day${dayClass}">${dow}</span>
      </div>
      <div class="schedule__venue-col">
        <span class="schedule__city">${show.city}</span>
        <span class="schedule__venue">${show.venue}</span>
        ${guestsHTML}
        ${soloHTML}
      </div>
      <div class="schedule__time-col">
        OPEN ${show.open || '—'} / START ${show.start || '—'}
      </div>
      <button class="schedule__detail-btn" data-show-id="${show.id}" aria-label="詳細">+</button>
    `;

    return li;
  }

  async function loadSchedule() {
    const list = document.getElementById('scheduleList');
    if (!list) return;

    try {
      const res = await fetch('data/shows.json');
      if (!res.ok) throw new Error('Failed to load shows.json');
      allShows = await res.json();

      // Only show phase 1 (livehouse) initially
      allShows.filter(s => s.phase === 1).forEach(show => {
        list.appendChild(createScheduleItem(show));
      });
    } catch (err) {
      console.error('Schedule load error:', err);
      list.innerHTML = '<li style="color: var(--color-sub-text);">スケジュールを読み込めませんでした。</li>';
    }
  }

  /* -----------------------------------------
     2b. SCHEDULE DETAIL MODAL
     ----------------------------------------- */
  function initScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    const closeBtn = document.getElementById('scheduleModalClose');
    const backdrop = modal ? modal.querySelector('.modal__backdrop') : null;
    const content = document.getElementById('scheduleModalContent');
    if (!modal || !closeBtn || !content) return;

    function open(showId) {
      const show = allShows.find(s => s.id === showId);
      if (!show) return;

      const { display, dow, dayType } = formatDate(show.date, show.holiday);
      const dayClass = dayType ? ` schedule__day--${dayType}` : '';

      let guestsHTML = '';
      if (show.guests && show.guests.length > 0) {
        const guestLinks = show.guests.map(g =>
          g.x_url
            ? `<a href="${g.x_url}" target="_blank" rel="noopener">${g.name}</a>`
            : g.name
        ).join(' / ');
        guestsHTML = `<p class="schedule-detail__guests">GUEST: ${guestLinks}</p>`;
      }
      if (show.solo) {
        guestsHTML = '<p class="schedule-detail__guests" style="color: var(--color-accent);">ONE MAN LIVE</p>';
      }

      let mapHTML = '';
      if (show.map_url) {
        mapHTML = `<a href="${show.map_url}" target="_blank" rel="noopener" class="schedule-detail__map-link">Google Map</a>`;
      }

      content.innerHTML = `
        <p class="schedule-detail__date">${display} <span class="${dayClass}">${dow}</span></p>
        <p class="schedule-detail__venue">${show.city} / ${show.venue}</p>
        <dl class="schedule-detail__info">
          <dt>OPEN </dt><dd>${show.open || 'TBA'}</dd>
          <dt>START </dt><dd>${show.start || 'TBA'}</dd>
        </dl>
        ${guestsHTML}
        ${mapHTML}
      `;

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Event delegation for + buttons
    document.addEventListener('click', e => {
      const btn = e.target.closest('.schedule__detail-btn');
      if (btn) {
        const id = parseInt(btn.dataset.showId);
        if (!isNaN(id)) open(id);
      }
    });

    closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  /* -----------------------------------------
     3. HAMBURGER MENU
     ----------------------------------------- */
  function initHamburger() {
    const btn = document.getElementById('hamburger');
    const overlay = document.getElementById('navOverlay');
    if (!btn || !overlay) return;

    function toggle() {
      const isOpen = btn.classList.toggle('is-open');
      overlay.classList.toggle('is-open', isOpen);
      overlay.setAttribute('aria-hidden', String(!isOpen));
      btn.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    btn.addEventListener('click', toggle);

    overlay.querySelectorAll('.nav-overlay__link').forEach(link => {
      link.addEventListener('click', () => {
        if (btn.classList.contains('is-open')) toggle();
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && btn.classList.contains('is-open')) toggle();
    });
  }

  /* -----------------------------------------
     5. LOGO HOME (scroll to top + replay animations)
     ----------------------------------------- */
  function initLogoHome() {
    const logo = document.getElementById('logoHome');
    if (!logo) return;

    logo.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // After scroll completes, replay hero animations
      setTimeout(() => {
        replayHeroAnimations();
      }, 600);
    });
  }

  function replayHeroAnimations() {
    if (typeof gsap === 'undefined') return;

    // Replay char-reveal on hero elements
    document.querySelectorAll('.hero .char').forEach(ch => {
      gsap.fromTo(ch,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' }
      );
    });

    // Replay hero logo
    const logo = document.querySelector('.hero__logo');
    if (logo) {
      gsap.fromTo(logo,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
      );
    }

    // Replay scroll hint
    const hint = document.querySelector('.hero__scroll-hint');
    if (hint) {
      gsap.fromTo(hint,
        { opacity: 0 },
        { opacity: 0.75, duration: 0.6, delay: 0.8 }
      );
    }
  }

  /* -----------------------------------------
     6. ACCORDION
     ----------------------------------------- */
  function initAccordions() {
    document.querySelectorAll('.accordion__trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', String(!expanded));

        // Lazy-load iframe on first open
        if (!expanded) {
          const content = trigger.nextElementSibling;
          if (content) {
            const iframe = content.querySelector('iframe[data-src]');
            if (iframe && !iframe.src) {
              iframe.src = iframe.dataset.src;
            }
          }
        }
      });
    });
  }

  /* -----------------------------------------
     7. NEWS — Load from news.json + Modal
     ----------------------------------------- */
  let newsData = [];

  async function loadNews() {
    const list = document.getElementById('newsList');
    if (!list) return;

    try {
      const res = await fetch('data/news.json');
      if (!res.ok) throw new Error('Failed to load news.json');
      newsData = await res.json();

      list.innerHTML = '';
      newsData.forEach(item => {
        const li = document.createElement('li');
        li.className = 'news__item';
        li.dataset.modal = item.id;
        li.innerHTML = `
          <time class="news__date">${item.date}</time>
          <span class="news__title">${item.title}</span>
        `;
        list.appendChild(li);
      });
    } catch (err) {
      console.error('News load error:', err);
      list.innerHTML = '<li style="color: var(--color-sub-text);">ニュースを読み込めませんでした。</li>';
    }
  }

  function initNewsModal() {
    const modal = document.getElementById('newsModal');
    const closeBtn = document.getElementById('modalClose');
    const backdrop = modal ? modal.querySelector('.modal__backdrop') : null;
    if (!modal || !closeBtn) return;

    const dateEl = document.getElementById('modalDate');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');

    function open(newsId) {
      const item = newsData.find(n => n.id === newsId);
      if (!item) return;
      dateEl.textContent = item.date;
      titleEl.textContent = item.title;
      bodyEl.innerHTML = item.body;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Event delegation — works with dynamically generated items
    document.addEventListener('click', e => {
      const item = e.target.closest('.news__item[data-modal]');
      if (item) open(item.dataset.modal);
    });

    closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  /* -----------------------------------------
     8. MOVIE CAROUSEL
     ----------------------------------------- */
  function initMovieCarousel() {
    const track = document.getElementById('movieTrack');
    const dotsContainer = document.getElementById('movieDots');
    const carousel = document.getElementById('movieCarousel');
    if (!track || !carousel) return;

    const slides = track.querySelectorAll('.carousel__slide');
    if (slides.length <= 1) {
      carousel.querySelectorAll('.carousel__arrow').forEach(a => a.style.display = 'none');
      return;
    }

    let current = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    function goTo(index) {
      current = Math.max(0, Math.min(index, slides.length - 1));
      track.style.transform = `translateX(-${current * 100}%)`;
      dotsContainer.querySelectorAll('.carousel__dot').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === current);
      });
    }

    carousel.querySelector('.carousel__arrow--prev')
      .addEventListener('click', () => goTo(current - 1));
    carousel.querySelector('.carousel__arrow--next')
      .addEventListener('click', () => goTo(current + 1));

    let touchStartX = 0;
    let touchDeltaX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchmove', e => { touchDeltaX = e.touches[0].clientX - touchStartX; }, { passive: true });
    track.addEventListener('touchend', () => {
      if (Math.abs(touchDeltaX) > 50) goTo(current + (touchDeltaX > 0 ? -1 : 1));
      touchDeltaX = 0;
    });
  }

  /* -----------------------------------------
     9. JOURNAL (V1 port — 3D Fan Carousel + Lightbox)
     ----------------------------------------- */
  let allJournalPhotos = [];

  const CAROUSEL_VISIBLE_RANGE = 2.5;
  const CAROUSEL_CARD_WIDTH = 260;

  function initJournal() {
    const container = document.getElementById('journalSections');
    if (!container) return;

    const journalData = {
      sections: [
        {
          id: 'past',
          title: '',
          subtitle: 'PAST LIVE PHOTOS',
          photos: [
            { src: 'img/journal/past/1.webp', caption: '', order: 1 },
            { src: 'img/journal/past/2.webp', caption: '', order: 2 },
            { src: 'img/journal/past/3.webp', caption: '', order: 3 },
            { src: 'img/journal/past/4.webp', caption: '', order: 4 },
            { src: 'img/journal/past/5.webp', caption: '', order: 5 },
            { src: 'img/journal/past/6.webp', caption: '', order: 6 },
            { src: 'img/journal/past/7.webp', caption: '', order: 7 },
            { src: 'img/journal/past/8.webp', caption: '', order: 8 },
            { src: 'img/journal/past/9.webp', caption: '', order: 9 },
            { src: 'img/journal/past/10.webp', caption: '', order: 10 }
          ]
        }
      ]
    };

    if (!journalData.sections || journalData.sections.length === 0) {
      container.innerHTML = '<p class="journal__placeholder-note">写真は準備中です</p>';
      return;
    }

    allJournalPhotos = [];
    journalData.sections.forEach(section => {
      section.photos.sort((a, b) => (a.order || 0) - (b.order || 0));
      section.photos.forEach(photo => allJournalPhotos.push(photo));
    });

    container.innerHTML = '';
    journalData.sections.forEach(section => {
      if (section.photos.length === 0) return;
      const sectionEl = createJournalSection(section);
      container.appendChild(sectionEl);
    });

    initLightbox();

    // Init carousel controls after DOM is built (slight delay for layout)
    setTimeout(() => {
      container.querySelectorAll('.fan-carousel').forEach(initFanCarouselControls);
    }, 100);
  }

  function createJournalSection(section) {
    const wrapper = document.createElement('div');
    wrapper.className = 'journal__section';
    wrapper.dataset.sectionId = section.id;

    // Section header
    const header = document.createElement('div');
    header.className = 'journal__section-header';
    header.innerHTML = `
      <span class="journal__section-subtitle">${section.subtitle || ''}</span>
      <h3 class="journal__section-title">${section.title}</h3>
    `;
    wrapper.appendChild(header);

    // 3D Fan Carousel
    const carousel = document.createElement('div');
    carousel.className = 'fan-carousel';

    const containerEl = document.createElement('div');
    containerEl.className = 'fan-carousel__container';

    const inner = document.createElement('div');
    inner.className = 'fan-carousel__inner';

    // Layer A: Invisible scroll layer
    const scrollLayer = document.createElement('div');
    scrollLayer.className = 'fan-carousel__scroll';

    const spacerStart = document.createElement('div');
    spacerStart.className = 'fan-carousel__spacer';
    scrollLayer.appendChild(spacerStart);

    section.photos.forEach((photo, i) => {
      // Snap target
      const snap = document.createElement('div');
      snap.className = 'fan-carousel__snap';
      scrollLayer.appendChild(snap);

      // Visual card (absolute)
      const slide = document.createElement('div');
      slide.className = 'fan-carousel__slide';
      const globalIdx = allJournalPhotos.indexOf(photo);
      slide.dataset.globalIndex = globalIdx;
      slide.dataset.localIndex = i;

      const cardLink = document.createElement('div');
      cardLink.className = 'fan-carousel__card-link';

      const img = document.createElement('img');
      img.className = 'fan-carousel__img';
      img.src = photo.src;
      img.alt = photo.caption || '';
      img.loading = 'lazy';

      if (photo.caption) {
        const overlay = document.createElement('div');
        overlay.className = 'fan-carousel__card-overlay';
        overlay.innerHTML = `<h3>${photo.caption}</h3>`;
        cardLink.appendChild(overlay);
      }

      cardLink.appendChild(img);
      slide.appendChild(cardLink);
      inner.appendChild(slide);
    });

    const spacerEnd = document.createElement('div');
    spacerEnd.className = 'fan-carousel__spacer';
    scrollLayer.appendChild(spacerEnd);

    inner.appendChild(scrollLayer);
    containerEl.appendChild(inner);
    carousel.appendChild(containerEl);

    // Navigation row
    const navRow = document.createElement('div');
    navRow.className = 'fan-carousel__nav-row';

    const arrowSvgPrev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    const arrowSvgNext = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'fan-carousel__arrow fan-carousel__arrow--prev';
    prevBtn.setAttribute('aria-label', '前へ');
    prevBtn.innerHTML = arrowSvgPrev;

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'fan-carousel__dots';
    section.photos.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'fan-carousel__dot';
      dot.dataset.index = i;
      dotsContainer.appendChild(dot);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'fan-carousel__arrow fan-carousel__arrow--next';
    nextBtn.setAttribute('aria-label', '次へ');
    nextBtn.innerHTML = arrowSvgNext;

    navRow.appendChild(prevBtn);
    navRow.appendChild(dotsContainer);
    navRow.appendChild(nextBtn);
    carousel.appendChild(navRow);

    wrapper.appendChild(carousel);
    return wrapper;
  }

  /**
   * 3D Fan Carousel controls — direct port of V1
   * Transform values:
   *   offset 0:  tx=0,   rotateY=0°,  scale=1.0, opacity=1.0, z=30
   *   offset ±1: tx=±220, rotateY=∓21°, scale=0.8, opacity=1.0, z=20
   *   offset ±2: tx=±380, rotateY=∓25°, scale=0.7, opacity=0.6, z=10
   */
  function initFanCarouselControls(carousel) {
    const scrollEl = carousel.querySelector('.fan-carousel__scroll');
    const cardEls = carousel.querySelectorAll('.fan-carousel__slide');
    const prevBtn = carousel.querySelector('.fan-carousel__arrow--prev');
    const nextBtn = carousel.querySelector('.fan-carousel__arrow--next');
    if (!scrollEl || cardEls.length === 0) return;

    const innerEl = carousel.querySelector('.fan-carousel__inner');
    const containerW = innerEl.offsetWidth;
    if (containerW === 0) return;

    const isMobile = window.innerWidth <= 768;
    const cardW = isMobile ? 150 : CAROUSEL_CARD_WIDTH;
    const spacerW = Math.floor(containerW / 2 - cardW / 2);

    // Set spacer widths
    carousel.querySelectorAll('.fan-carousel__spacer').forEach(s => {
      s.style.width = spacerW + 'px';
    });

    // Set snap widths
    carousel.querySelectorAll('.fan-carousel__snap').forEach(s => {
      s.style.width = cardW + 'px';
    });

    // Set card dimensions
    const cardH = isMobile ? 150 : 260;
    cardEls.forEach(card => {
      card.style.cssText = `width:${cardW}px; height:${cardH}px; left:calc(50% - ${cardW / 2}px);`;
    });

    const dots = carousel.querySelectorAll('.fan-carousel__dot');

    function updateCards() {
      const mobile = window.innerWidth <= 768;
      const cw = mobile ? 150 : CAROUSEL_CARD_WIDTH;
      const scrollLeft = scrollEl.scrollLeft;
      const activeIndex = Math.round(scrollLeft / cw);

      cardEls.forEach((card, i) => {
        const offset = i - scrollLeft / cw;
        const absO = Math.abs(offset);
        const sign = offset >= 0 ? 1 : -1;

        if (absO > CAROUSEL_VISIBLE_RANGE) {
          card.style.opacity = '0';
          card.style.zIndex = '0';
          return;
        }

        const baseTx = mobile ? 130 : 200;
        const extraTx = mobile ? 90 : 140;
        const tx = sign * (baseTx * Math.min(absO, 1) + extraTx * Math.max(0, absO - 1));
        const ryDeg = -sign * (21 * Math.min(absO, 1) + 4 * Math.max(0, absO - 1));
        const ry = ryDeg * Math.PI / 180;
        const s = Math.max(0.5, 1.0 - 0.2 * Math.min(absO, 1) - 0.1 * Math.max(0, absO - 1));
        const op = absO <= 1.5 ? 1.0 : Math.max(0, 1.0 - (absO - 1.5) * 0.8);
        const z = Math.max(0, 30 - Math.round(absO) * 10);

        const cosR = Math.cos(ry);
        const sinR = Math.sin(ry);
        card.style.transform = `matrix3d(${(s * cosR).toFixed(6)},0,${(-sinR).toFixed(6)},0,0,${s.toFixed(6)},0,0,${(sinR * s).toFixed(6)},0,${cosR.toFixed(6)},0,${tx.toFixed(2)},0,0,1)`;
        card.style.opacity = op.toFixed(4);
        card.style.zIndex = z.toString();
      });

      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('is-active', i === activeIndex);
      }
    }

    function getCurrentCardW() {
      return window.innerWidth <= 768 ? 150 : CAROUSEL_CARD_WIDTH;
    }

    function onScroll() {
      requestAnimationFrame(updateCards);
    }

    if (!carousel._eventsBound) {
      carousel._eventsBound = true;

      scrollEl.addEventListener('scroll', onScroll, { passive: true });

      // Card click → lightbox (center) or scroll (side)
      scrollEl.addEventListener('click', e => {
        const cw = getCurrentCardW();
        const centerIdx = Math.round(scrollEl.scrollLeft / cw);
        const clampedIdx = Math.max(0, Math.min(cardEls.length - 1, centerIdx));
        const mobile = window.innerWidth <= 768;

        if (!mobile) {
          const rect = innerEl.getBoundingClientRect();
          const clickOffset = (e.clientX - rect.left - rect.width / 2) / cw;
          const targetIdx = Math.round(clampedIdx + clickOffset);
          const finalIdx = Math.max(0, Math.min(cardEls.length - 1, targetIdx));

          if (Math.abs(finalIdx - clampedIdx) >= 1) {
            scrollEl.scrollTo({ left: finalIdx * cw, behavior: 'smooth' });
            return;
          }
        }

        const slide = cardEls[clampedIdx];
        if (slide) {
          const globalIdx = parseInt(slide.dataset.globalIndex);
          if (!isNaN(globalIdx)) openLightbox(globalIdx);
        }
      });

      if (prevBtn) prevBtn.addEventListener('click', () => {
        const cw = getCurrentCardW();
        scrollEl.scrollBy({ left: -cw, behavior: 'smooth' });
      });
      if (nextBtn) nextBtn.addEventListener('click', () => {
        const cw = getCurrentCardW();
        scrollEl.scrollBy({ left: cw, behavior: 'smooth' });
      });

      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          const cw = getCurrentCardW();
          const idx = parseInt(dot.dataset.index);
          scrollEl.scrollTo({ left: idx * cw, behavior: 'smooth' });
        });
      });
    }

    scrollEl.scrollLeft = 0;
    updateCards();
  }

  /* -----------------------------------------
     9b. LIGHTBOX
     ----------------------------------------- */
  let lightboxIndex = 0;

  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lbClose = lightbox.querySelector('.lightbox__close-bottom');
    const lbPrev = lightbox.querySelector('.lightbox__arrow--prev');
    const lbNext = lightbox.querySelector('.lightbox__arrow--next');

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', () => lightboxNav(-1));
    if (lbNext) lbNext.addEventListener('click', () => lightboxNav(1));

    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('is-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
    });
  }

  function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    if (!lightbox || !lightboxImg || index < 0 || index >= allJournalPhotos.length) return;

    lightboxIndex = index;
    const photo = allJournalPhotos[index];
    lightboxImg.src = photo.src;
    if (lightboxCaption) {
      lightboxCaption.textContent = photo.caption || '';
      lightboxCaption.style.display = photo.caption ? 'block' : 'none';
    }
    lightbox.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  function lightboxNav(dir) {
    const newIdx = (lightboxIndex + dir + allJournalPhotos.length) % allJournalPhotos.length;
    openLightbox(newIdx);
  }

  /* -----------------------------------------
     10. INTERSECTION OBSERVER (fade-item)
     ----------------------------------------- */
  function initFadeObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-item').forEach(el => observer.observe(el));
  }

  /* -----------------------------------------
     11. GSAP ANIMATIONS
     ----------------------------------------- */
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // --- Heading reveal (clip-path) ---
    gsap.utils.toArray('.reveal-heading').forEach(heading => {
      gsap.fromTo(heading,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 80%',
            once: true
          }
        }
      );
    });

    // --- Character reveal (hero) ---
    document.querySelectorAll('.char-reveal').forEach(el => {
      splitChars(el);
      gsap.fromTo(el.querySelectorAll('.char'),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.04,
          ease: 'power2.out',
          delay: 0.6
        }
      );
    });

    // --- Hero logo entrance ---
    const heroLogo = document.querySelector('.hero__logo');
    if (heroLogo) {
      gsap.fromTo(heroLogo,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1, ease: 'power2.out', delay: 0.2 }
      );
    }

    // --- Stagger list items ---
    gsap.utils.toArray('.stagger-list').forEach(list => {
      const items = list.querySelectorAll('li');
      if (items.length === 0) return;

      gsap.fromTo(items,
        { opacity: 0, y: 20, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.5,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: list,
            start: 'top 80%',
            once: true
          }
        }
      );
    });

    // --- Hero scroll hint fade out on scroll ---
    const scrollHint = document.querySelector('.hero__scroll-hint');
    if (scrollHint) {
      gsap.to(scrollHint, {
        opacity: 0,
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: '+=200',
          scrub: true
        }
      });
    }
  }

  /* -----------------------------------------
     UTIL: Split text into individual chars
     ----------------------------------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);

    text.split('').forEach(char => {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.setAttribute('aria-hidden', 'true');
      el.appendChild(span);
    });
  }

  /* -----------------------------------------
     INIT
     ----------------------------------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    // Core
    initCountdown();
    initLogoHome();

    // Data
    await loadSchedule();
    await loadNews();

    // Interactions
    initHamburger();
    initAccordions();
    initNewsModal();
    initScheduleModal();
    initMovieCarousel();
    initJournal();

    // Animations
    initFadeObserver();
    initGSAP();
  });

})();
