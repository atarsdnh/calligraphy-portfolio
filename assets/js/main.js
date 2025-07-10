document.addEventListener('DOMContentLoaded', function() {
  fetch('assets/data/images.json')
    .then(response => response.json())
    .then(images => {
      const gallery = document.getElementById('gallery');
      images.forEach(image => {
        const anchor = document.createElement('a');
        anchor.classList.add('grid-item');
        if (image.class) {
          image.class.split(' ').forEach(cls => anchor.classList.add(cls));
        }
        anchor.href = image.full;
        anchor.setAttribute('data-lightbox', 'gallery');
        anchor.setAttribute('data-title', image.data_title);

        const img = document.createElement('img');
        img.src = image.thumb;
        img.alt = image.alt;
        img.loading = 'lazy';
        if (image.style) {
          img.style.cssText = image.style;
        }

        anchor.appendChild(img);
        gallery.appendChild(anchor);
      });

      // Reinitialize Lightbox after dynamic content is loaded
      lightbox.init();
    })
    .catch(error => console.error('Error loading images:', error));
});