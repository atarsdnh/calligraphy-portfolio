import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.js';

const preloadDimensions = (anchor, fullUrl) => {
  return new Promise((resolve) => {
    const preloadImg = new Image();
    preloadImg.onload = function () {
      anchor.dataset.pswpWidth = preloadImg.naturalWidth;
      anchor.dataset.pswpHeight = preloadImg.naturalHeight;
      resolve();
    };
    preloadImg.onerror = function () {
      anchor.dataset.pswpWidth = 1600; // Fallback
      anchor.dataset.pswpHeight = 1200; // Fallback
      console.error('Failed to load image dimensions for', fullUrl);
      resolve(); // Always resolve to not break Promise.all
    };
    preloadImg.src = fullUrl;
  });
};

document.addEventListener('DOMContentLoaded', function () {
  const gallery = document.getElementById('gallery');

  fetch('assets/data/images.json')
    .then(response => response.json())
    .then(images => {
      const dimensionPromises = [];

      images.forEach((image, index) => {
        const anchor = document.createElement('a');
        anchor.classList.add('grid-item');
        if (image.class) {
          image.class.split(' ').forEach(cls => anchor.classList.add(cls));
        }
        anchor.href = image.full;
        anchor.title = image.data_title;
        anchor.dataset.index = index;
        // Use a human-readable slug for the URL
        anchor.dataset.pswpSlug = image.alt;

        const img = document.createElement('img');
        img.src = image.thumb;
        img.alt = image.alt;
        img.loading = 'lazy';
        if (image.style) {
          img.style.cssText = image.style;
        }

        anchor.appendChild(img);
        gallery.appendChild(anchor);

        // Add the promise to the array to be awaited
        dimensionPromises.push(preloadDimensions(anchor, image.full));
      });

      // Wait for all dimensions to be preloaded before initializing PhotoSwipe
      Promise.all(dimensionPromises).then(() => {
        const lightbox = new PhotoSwipeLightbox({
          gallery: '#gallery',
          children: 'a',
          pswpModule: () => import('https://unpkg.com/photoswipe@5/dist/photoswipe.esm.js'),
          history: true
        });

        lightbox.on('uiRegister', function() {
          lightbox.pswp.ui.registerElement({
            name: 'custom-caption',
            order: 9,
            isButton: false,
            appendTo: 'root',
            onInit: (el, pswp) => {
              const captionContent = document.createElement('div');
              captionContent.className = 'pswp-caption-content';
              el.appendChild(captionContent);

              pswp.on('change', () => {
                const currSlideElement = pswp.currSlide.data.element;
                let captionHTML = '';
                if (currSlideElement) {
                  captionHTML = currSlideElement.getAttribute('title');
                  
                  // Also update the URL hash when the slide changes via arrows
                  const slug = currSlideElement.dataset.pswpSlug;
                  const newHash = '#' + encodeURIComponent(slug);

                  if (slug && window.location.hash !== newHash) {
                    // Use replaceState to avoid polluting browser history on arrow clicks
                    history.replaceState(null, '', newHash);
                  }
                }
                captionContent.innerHTML = captionHTML || '';
              });
            }
          });
        });

        lightbox.on('close', () => {
          // remove hash from URL when gallery is closed
          history.replaceState(null, '', window.location.pathname);
        });

        lightbox.init();

        // Manually trigger lightbox from URL hash (slug) after initialization
        const slug = decodeURIComponent(window.location.hash.substring(1));
        if (slug) {
          const index = images.findIndex(img => img.alt === slug);
          if (index !== -1) {
            lightbox.loadAndOpen(index);
          }
        }
      });
    })
    .catch(error => console.error('Error loading images:', error));
});