!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);

// ===== NEXT =====

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-54PZ2LQ');

// ===== NEXT =====


{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Humblebee AB",
  "url": "https://www.humblebee.se",
  "logo": "https://cdn.prod.website-files.com/65a6d736d0f0686554aa673a/6633e3821d6ec78f553b5cd4_webclip.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+46761191201",
    "contactType": "Customer Service",
    "areaServed": "SE",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://www.instagram.com/wearehumblebee",
    "https://www.facebook.com/wearehumblebee",
    "https://www.linkedin.com/company/humblebee",
    "https://medium.com/wearehumblebee",
    "https://www.eventbrite.com/o/humblebee-18567327820"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kvarnbergsgatan 2",
    "addressLocality": "Gothenburg",
    "addressRegion": "Västra Götaland",
    "postalCode": "41105",
    "addressCountry": "Sweden"
  },
  "description": "Humblebee is a creative digital studio that provides services and solutions for agencies and brands."
},
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://www.humblebee.se",
  "name": "Humblebee AB",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.humblebee.se/?s={search_term_string}",
    "query-input": "required name=search_term_string"
  }
},
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.humblebee.se"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Work",
      "item": "https://www.humblebee.se/work"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Stories",
      "item": "https://www.humblebee.se/stories"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Services",
      "item": "https://www.humblebee.se/services"
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "Careers",
      "item": "https://www.humblebee.se/careers"
    },
    {
      "@type": "ListItem",
      "position": 6,
      "name": "About us",
      "item": "https://www.humblebee.se/about-us"
    },
    {
      "@type": "ListItem",
      "position": 7,
      "name": "Contact us",
      "item": "https://www.humblebee.se/contact"
    }
  ]
}


// ===== NEXT =====


(function() {

  // ── Nav overlay toggle ──
  function initNav() {
    var navBtn = document.querySelector('.nav-menu-btn');
    var navPill = document.querySelector('.nav-pill');
    if (!navBtn || !navPill) return;
    navBtn.addEventListener('click', function() {
      navPill.classList.toggle('is-open');
    });
  }

  // ── Email copy button ──
  function initEmailCopy() {
    document.querySelectorAll('.email-copy-btn').forEach(function(btn) {
      var label = btn.querySelector('.email-copy-text');
      if (!label) return;
      var email = 'hello@humblebee.se';
      var copied = false;
      btn.addEventListener('mouseenter', function() {
        if (!copied) {
          label.style.opacity = '0';
          setTimeout(function() { label.textContent = email; label.style.opacity = '1'; }, 150);
        }
      });
      btn.addEventListener('mouseleave', function() {
        if (!copied) {
          label.style.opacity = '0';
          setTimeout(function() { label.textContent = 'Say Hello'; label.style.opacity = '1'; }, 150);
        }
      });
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (copied) return;
        navigator.clipboard.writeText(email).then(function() {
          copied = true;
          label.style.opacity = '0';
          setTimeout(function() {
           label.innerHTML = 'Email copied &nbsp;<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
label.style.flexDirection = 'row';
label.style.alignItems = 'center';
btn.classList.add('is-copied'); label.style.opacity = '1';
          }, 150);
          setTimeout(function() {
            copied = false;
            btn.classList.remove('is-copied');
            label.style.opacity = '0';
            setTimeout(function() { label.textContent = 'Say Hello'; label.style.opacity = '1'; }, 150);
          }, 3000);
        });
      });
    });
  }

  // ── Scroll pills animation (home page only) ──
 function initPills() {
  if (!window.gsap || !window.ScrollTrigger) { setTimeout(initPills, 60); return; }
  var root = document.getElementById("stw-root");
  var stage = document.getElementById("stw-stage");
  var title = document.getElementById("stw-title");
  if (!root || !stage || !title) return;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  var pills = Array.from(root.querySelectorAll(".stw-pill"));
  var data = [
    { x: 0, y: 0, tilt: -5 }, { x: 0, y: 0, tilt: 4 }, { x: 0, y: 0, tilt: -3 },
    { x: 0, y: 0, tilt: 5 }, { x: 0, y: 0, tilt: -4 }, { x: 0, y: 0, tilt: 3 },
    { x: 0, y: 0, tilt: -6 }, { x: 0, y: 0, tilt: 4 }, { x: 0, y: 0, tilt: -5 },
    { x: 0, y: 0, tilt: 3 },
  ];

  if (window.innerWidth < 768) {
    ST.config({ ignoreMobileResize: true });
    var items = pills.map(function(pill) {
      var span = pill.querySelector('span');
      return { text: span ? span.textContent.trim() : '', color: span ? span.style.color : 'rgb(255,128,0)' };
    }).filter(function(item) { return item.text; });
    pills.forEach(function(el) { el.style.display = 'none'; });
    stage.style.cssText = 'position:relative;width:100%;height:auto;min-height:420px;overflow:hidden;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px 80px;';
    title.style.position = 'relative';
    title.style.left = 'auto';
    title.style.top = 'auto';
    title.style.transform = 'none';
    title.style.whiteSpace = 'normal';
    title.style.marginBottom = '40px';
    title.style.textAlign = 'center';
    gsap.set(title, { opacity: 0, y: 16 });
    var stackWrap = document.createElement('div');
    stackWrap.style.cssText = 'position:relative;width:min(280px,82vw);height:148px;flex-shrink:0;';
    stage.appendChild(stackWrap);
    var angles = [2, -4, 3.5, -2.5, 4, -1.5, 2.5, -3, 4.5, -2];
    var cardEls = items.map(function(item) {
      var card = document.createElement('div');
      card.style.cssText = [
        'position:absolute;top:0;left:0;width:100%;height:128px',
        'background:#ffffff',
        'border:2.5px solid ' + item.color,
        'border-radius:20px',
        'padding:0 22px',
        'box-sizing:border-box',
        'display:flex;align-items:center;justify-content:center',
        'font-family:Inter,sans-serif',
        'font-weight:700',
        'font-size:clamp(13px,4vw,17px)',
        'line-height:1.25',
        'letter-spacing:-0.2px',
        'color:' + item.color,
        'text-align:center'
      ].join(';');
      card.textContent = item.text;
      stackWrap.appendChild(card);
      return card;
    });
    gsap.set(cardEls, { opacity: 0 });
    cardEls.forEach(function(card, i) {
      gsap.set(card, { y: i * 10, scale: 1 - i * 0.048, rotation: angles[i % angles.length], zIndex: cardEls.length - i });
    });
    var busy = false;
    function advance() {
      if (busy) return;
      busy = true;
      var top = cardEls[0];
      gsap.to(top, {
        x: '-145%', rotation: -22, opacity: 0, duration: 0.42, ease: 'power2.in',
        onComplete: function() {
          cardEls.push(cardEls.shift());
          gsap.set(top, { x: 0, y: cardEls.length * 10, scale: 0.82, rotation: 3, opacity: 0, zIndex: 0 });
          cardEls.forEach(function(card, i) {
            gsap.to(card, {
              y: i * 10, scale: 1 - i * 0.048, rotation: angles[i % angles.length],
              opacity: i === 0 ? 1 : i === 1 ? 0.75 : i === 2 ? 0.45 : 0,
              zIndex: cardEls.length - i, duration: 0.38, ease: 'power2.out'
            });
          });
          gsap.delayedCall(0.4, function() { busy = false; });
        }
      });
    }
    var introTl = gsap.timeline({
      scrollTrigger: { trigger: stage, start: 'top 70%' },
      onComplete: function() { setInterval(advance, 2800); }
    });
    introTl.to(title, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' });
    introTl.to(cardEls[2], { opacity: 0.45, duration: 0.4, ease: 'power2.out' }, '-=0.1');
    introTl.to(cardEls[1], { opacity: 0.75, duration: 0.4, ease: 'power2.out' }, '-=0.25');
    introTl.to(cardEls[0], { opacity: 1, duration: 0.6, ease: 'back.out(1.3)' }, '-=0.25');
    return;
  }

  pills.forEach(function(el, i) {
    var d = data[i] || { x: 0, y: 0, tilt: 0 };
    gsap.set(el, { xPercent: -50, yPercent: -50, x: d.x, y: d.y, rotation: d.tilt, opacity: 0, scale: 0.8 });
  });
  gsap.set(title, { opacity: 1 });
  var tl = gsap.timeline({
    scrollTrigger: {
      trigger: root, start: "top top",
      end: "+=" + (300 + pills.length * 600),
      scrub: 0.6, pin: stage, anticipatePin: 1
    }
  });
  tl.to({}, { duration: 0.4 });
  tl.to(title, { opacity: 0.18, scale: 0.92, duration: 1, ease: "power1.out" }, ">");
  pills.forEach(function(el, i) {
    var d = data[i];
    tl.fromTo(el,
      { opacity: 0, scale: 0.8, y: d.y + 70, rotation: d.tilt - 6 },
      { opacity: 1, scale: 1, y: d.y, rotation: d.tilt, duration: 1.6, ease: "back.out(1.4)" },
      i === 0 ? ">-0.4" : ">+0.4"
    );
    tl.to({}, { duration: 1.1 });
  });
  tl.to({}, { duration: 0.5 });
  ST.refresh();
}


// ── Reveal text animation ──
function initRevealText() {
  var elements = document.querySelectorAll('.reveal-text');
  if (!elements.length) return;
  elements.forEach(function(el) {
    el.innerHTML = el.innerText.split(' ').map(function(word) {
      return '<span style="color:#aaa;">' + word + '</span>';
    }).join(' ');
    var spans = Array.from(el.querySelectorAll('span'));
    var last = -1;
    function tick() {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = Math.min(1, Math.max(0,
        (vh * 0.95 - rect.top) / (vh * 0.65 + el.offsetHeight)
      ));
      if (Math.abs(progress - last) > 0.005) {
        last = progress;
        spans.forEach(function(span, i) {
          span.style.color = progress > (i / spans.length) ? '#161616' : '#aaa';
        });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

  // ── Init all on DOM ready ──
  function initAll() {
    initNav();
    initEmailCopy();
    initPills();
    initRevealText();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

})();


// ===== NEXT =====


  window.addEventListener('load', function () {
    window.dispatchEvent(new Event('resize'));
  });
