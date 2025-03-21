

(function () {
  const doc = document
  const win = window
  const rootEl = doc.documentElement
  const body = doc.body


  const lightSwitch = doc.getElementById('lights-toggle')
  /* global ScrollReveal */
  const sr = window.sr = ScrollReveal()

  rootEl.classList.remove('no-js')
  rootEl.classList.add('js')

  window.addEventListener('load', function () {
    body.classList.add('is-loaded')
    body.classList.add('lights-off')
  })

  // Reveal animations
  function revealAnimations () {
    sr.reveal('.feature', {
      duration: 600,
      distance: '20px',
      easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      origin: 'right',
      viewFactor: 0.2
    })
  }

  if (body.classList.contains('has-animations')) {
    window.addEventListener('load', revealAnimations)
  }

  // Moving objects
  const movingObjects = document.querySelectorAll('.is-moving-object')

  // Throttling
  function throttle (func, milliseconds) {
    let lastEventTimestamp = null
    let limit = milliseconds

    return (...args) => {
      let now = Date.now()

      if (!lastEventTimestamp || now - lastEventTimestamp >= limit) {
        lastEventTimestamp = now
        func.apply(this, args)
      }
    }
  }

  // Init vars
  let mouseX = 0
  let mouseY = 0
  let scrollY = 0
  let coordinateX = 0
  let coordinateY = 0
  let winW = rootEl.clientWidth
  let winH = rootEl.clientHeight

  // Move Objects
  function moveObjects(e, object) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    scrollY = win.scrollY;
    coordinateX = (winW / 2) - mouseX;
    coordinateY = (winH / 2) - (mouseY - scrollY);
  
    for (let i = 0; i < object.length; i++) {
      const translatingFactor = object[i].getAttribute('data-translating-factor') || 40;
      const rotatingFactor = object[i].getAttribute('data-rotating-factor') || 40;
      const perspective = object[i].getAttribute('data-perspective') || 1000;
      let tranformProperty = [];
  
      if (object[i].classList.contains('is-translating')) {
        tranformProperty.push('translate(' + coordinateX / translatingFactor + 'px, ' + coordinateY / translatingFactor + 'px)');
      }
  
      if (object[i].classList.contains('is-rotating')) {
        // Reverse horizontal (rotateY) direction
        tranformProperty.push('perspective(' + perspective + 'px) rotateY(' + coordinateX / rotatingFactor + 'deg) rotateX(' + -coordinateY / rotatingFactor + 'deg)');
      }
  
      if (object[i].classList.contains('is-translating') || object[i].classList.contains('is-rotating')) {
        tranformProperty = tranformProperty.join(' ');
  
        object[i].style.transform = tranformProperty;
        object[i].style.transition = 'transform 1s ease-out';
        object[i].style.transformStyle = 'preserve-3d';
        object[i].style.backfaceVisibility = 'hidden';
      }
    }
  }
  

  // Call function with throttling
  if (movingObjects) {
    win.addEventListener('mousemove', throttle(
      function (e) {
        moveObjects(e, movingObjects)
      },
      150
    ))
  }

 




  
}())
