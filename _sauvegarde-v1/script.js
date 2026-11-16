const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');


/* =========================
   MENU MOBILE
========================= */

if (menuToggle && navigation) {

  menuToggle.addEventListener('click', () => {

    const isOpen =
      menuToggle.getAttribute('aria-expanded') === 'true';

    menuToggle.setAttribute(
      'aria-expanded',
      String(!isOpen)
    );

    navigation.classList.toggle(
      'is-open',
      !isOpen
    );

  });


  navigation.querySelectorAll('a').forEach((link) => {

    link.addEventListener('click', () => {

      menuToggle.setAttribute(
        'aria-expanded',
        'false'
      );

      navigation.classList.remove('is-open');

    });

  });

}


/* =========================
   ANIMATIONS AU SCROLL
========================= */

const revealItems =
  document.querySelectorAll('.reveal');


if ('IntersectionObserver' in window) {

  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              'is-visible'
            );

            observer.unobserve(
              entry.target
            );

          }

        });

      },
      {
        threshold: 0.12
      }
    );


  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });

} else {

  revealItems.forEach((item) => {
    item.classList.add('is-visible');
  });

}


/* =========================
   NAVIGATION ACTIVE
========================= */

const sections =
  document.querySelectorAll('main section[id]');

const navLinks =
  document.querySelectorAll('.main-nav a[href^="#"]');


if ('IntersectionObserver' in window) {

  const sectionObserver =
    new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) {
            return;
          }

          const currentId =
            entry.target.getAttribute('id');

          navLinks.forEach((link) => {

            link.classList.remove('active');

            if (
              link.getAttribute('href') ===
              `#${currentId}`
            ) {
              link.classList.add('active');
            }

          });

        });

      },
      {
        threshold: 0.35
      }
    );


  sections.forEach((section) => {
    sectionObserver.observe(section);
  });

}


/* =========================
   EFFET LEGER SUR LES CARTES
========================= */

const productCards =
  document.querySelectorAll('.product-card');


productCards.forEach((card) => {

  const visual =
    card.querySelector('.product-visual');

  if (!visual) {
    return;
  }


  card.addEventListener('mouseenter', () => {

    visual.style.transform =
      'translateY(-6px)';

    visual.style.transition =
      'transform 0.35s ease';

  });


  card.addEventListener('mouseleave', () => {

    visual.style.transform =
      'translateY(0)';

  });

});


/* =========================
   CLAVIER / ACCESSIBILITE
========================= */

document.addEventListener('keydown', (event) => {

  if (
    event.key === 'Escape' &&
    navigation &&
    menuToggle
  ) {

    navigation.classList.remove('is-open');

    menuToggle.setAttribute(
      'aria-expanded',
      'false'
    );

  }

});
