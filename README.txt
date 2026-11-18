زیادکردنی وێنەی نوێ / How to add new photos
1) Put the photo (webp or jpg, width ~1400px) in the matching folder: images/bedrooms, wardrobes, decor, kitchens
2) In index.html find that section's <div class="gallery"> and copy one line:
   <figure><img src="images/bedrooms/NEW.webp" alt="وەسفی وێنە" loading="lazy"></figure>
   The lightbox picks it up automatically.
Logo: replace images/logo/logo.svg (or change the filename in index.html).
