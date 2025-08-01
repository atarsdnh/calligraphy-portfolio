import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.js';

document.addEventListener('DOMContentLoaded', function () {
  // 自動將 .panorama-scroll-container 捲動到最右側
  const panoContainer = document.querySelector('.panorama-scroll-container');
  if (panoContainer) {
    panoContainer.scrollLeft = panoContainer.scrollWidth;

    // Show scroll hint when user scrolls left for the first time
    const panoramaContainer = document.getElementById('panoramaContainer');
    const scrollHint = document.getElementById('scrollHint');
    let hintShown = false;
    let hintVisible = false;
    if (panoramaContainer && scrollHint) {
      panoramaContainer.addEventListener('scroll', function () {
        if (
          !hintShown &&
          panoramaContainer.scrollLeft >= panoramaContainer.scrollWidth - panoramaContainer.clientWidth - 5
        ) {
          hintShown = true;
          scrollHint.classList.add('show');
          hintVisible = true;
        }
      });
      panoramaContainer.addEventListener('scroll', function () {
        if (
          hintVisible &&
          panoramaContainer.scrollLeft < panoramaContainer.scrollWidth - panoramaContainer.clientWidth - 5
        ) {
          scrollHint.classList.remove('show');
          hintVisible = false;
        }
      });
    }
  }
  // ===== Panorama Swiper Initialization 已移除 =====
  const gallery = document.getElementById('gallery');

  const preloadFullImage = (anchor, fullUrl) => {
    return new Promise((resolve) => {
      const preloadImg = new Image();
      preloadImg.decoding = 'async';
      preloadImg.fetchPriority = 'high';

      preloadImg.onload = function () {
        anchor.dataset.pswpWidth = preloadImg.naturalWidth;
        anchor.dataset.pswpHeight = preloadImg.naturalHeight;
        resolve();
      };
      preloadImg.onerror = function () {
        anchor.dataset.pswpWidth = 1600;
        anchor.dataset.pswpHeight = 1200;
        resolve(); // Resolve even on error to not block the flow
      };
      preloadImg.src = fullUrl;
    });
  };

  fetch('assets/data/images.json')
    .then(response => response.json())
    .then(images => {
      const anchors = [];
      const preloadPromises = [];

      // 1. 先建立所有 DOM 元素
      images.forEach((image, index) => {
        const anchor = document.createElement('a');
        anchor.classList.add('grid-item');
        if (image.class) {
          image.class.split(' ').forEach(cls => anchor.classList.add(cls));
        }
        anchor.href = image.full;
        anchor.dataset.pswpSrc = image.full;
        anchor.dataset.pswpTitle = image.data_title;
        anchor.dataset.index = index;

        const img = document.createElement('img');
        img.src = image.thumb;
        img.alt = image.alt;
        img.loading = 'lazy';
        if (image.style) {
          img.style.cssText = image.style;
        }

        anchor.appendChild(img);
        gallery.appendChild(anchor);
        anchors.push(anchor);

        // 2. 為每一張圖片建立一個預載入尺寸的 Promise
        preloadPromises.push(preloadFullImage(anchor, image.full));
      });

      // 3. 等待所有圖片尺寸都載入完成後，才初始化 lightbox
      Promise.all(preloadPromises).then(() => {
        const lightbox = new PhotoSwipeLightbox({
          gallery: '#gallery',
          children: 'a',
          pswpModule: () => import('https://unpkg.com/photoswipe@5/dist/photoswipe.esm.js'),
          // preload 選項可以移除或保留，因為所有尺寸都已載入
          // preload: [[1,2], [2,3]],
          preloaderDelay: 200,
          initialZoomLevel: 'fit',
          history: false,
        });

        lightbox.on('uiRegister', function() {
          lightbox.pswp.ui.registerElement({
            name: 'custom-caption',
            order: 9,
            isButton: false,
            appendTo: 'root',
            html: 'Caption text',
            onInit: (el, pswp) => {
              pswp.on('change', () => {
                const currSlideElement = pswp.currSlide.data.element;
                let captionHTML = '';
                if (currSlideElement) {
                  captionHTML = currSlideElement.dataset.pswpTitle || '';
                }
                el.innerHTML = captionHTML ? `<div class="pswp-caption-content">${captionHTML}</div>` : '';
              });
            }
          });
        });

        // 當燈箱中的圖片更換時，更新 URL hash
        lightbox.on('change', () => {
          const { pswp } = lightbox;
          if (pswp && pswp.currSlide) {
            const currSlideElement = pswp.currSlide.data.element;
            if (currSlideElement) {
              const alt = currSlideElement.querySelector('img').alt;
              const newHash = '#' + encodeURIComponent(alt);
              if (history.state?.pswp !== newHash) {
                history.replaceState({ pswp: newHash }, '', newHash);
              }
            }
          }
        });

        // 當燈箱關閉時，清除 URL hash
        lightbox.on('close', () => {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        });

        // before-change 事件監聽器已不再需要，因為所有尺寸都已預載
        // lightbox.on('before-change', ...);

        lightbox.init();

        // 處理從 URL hash 來的直接連結
        const hash = window.location.hash.substring(1);
        if (hash) {
          const decodedAlt = decodeURIComponent(hash);
          const imageIndex = images.findIndex(img => img.alt === decodedAlt);
          if (imageIndex > -1) {
            // 因為所有尺寸都已載入，可以直接開啟，但保留延遲以防萬一
            setTimeout(() => {
              lightbox.loadAndOpen(imageIndex);
            }, 10);
          }
        }
      });
    })
    .catch(error => console.error('Error loading images:', error));
});
