import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.js';

document.addEventListener('DOMContentLoaded', function () {
  const gallery = document.getElementById('gallery');

  const preloadFullImage = (anchor, fullUrl) => {
    const preloadImg = new Image();
    preloadImg.decoding = 'async';
    preloadImg.fetchPriority = 'high';

    preloadImg.onload = function () {
      anchor.dataset.pswpWidth = preloadImg.naturalWidth;
      anchor.dataset.pswpHeight = preloadImg.naturalHeight;
    };
    preloadImg.onerror = function () {
      anchor.dataset.pswpWidth = 1600;
      anchor.dataset.pswpHeight = 1200;
    };
    preloadImg.src = fullUrl;
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const anchor = entry.target;
        preloadFullImage(anchor, anchor.dataset.pswpSrc);
        observer.unobserve(anchor);
      }
    });
  }, { rootMargin: '200px' });

  fetch('assets/data/images.json')
    .then(response => response.json())
    .then(images => {
      const promises = images.map((image, index) => {
        return new Promise((resolve) => {
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

          observer.observe(anchor);

          resolve();
        });
      });

      // 等待所有圖片都抓完尺寸後再初始化 lightbox
      Promise.all(promises).then(() => {
        const lightbox = new PhotoSwipeLightbox({
          gallery: '#gallery',
          children: 'a',
          pswpModule: () => import('https://unpkg.com/photoswipe@5/dist/photoswipe.esm.js'),
          preload: [[1,2], [2,3]],
          preloaderDelay: 200,
          initialZoomLevel: 'fit',
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

        lightbox.init();
      });
    })
    .catch(error => console.error('Error loading images:', error));
});