document.addEventListener("DOMContentLoaded", () => {
  // Loader
  const loader = document.querySelector(".loader")
  const loaderProgressBar = document.querySelector(".loader-progress-bar")
  const loaderText = document.querySelector(".loader-text")

  // Simulate loading progress
  let progress = 0
  const loadingDuration = 1000 // 1 second total
  const interval = 30 // Update every 30ms
  const increment = (100 * interval) / loadingDuration

  const loadingInterval = setInterval(() => {
    progress = Math.min(100, progress + increment)

    loaderProgressBar.style.width = `${progress}%`
    loaderText.textContent = `${Math.round(progress)}%`

    if (progress >= 100) {
      clearInterval(loadingInterval)
      setTimeout(() => {
        loader.classList.add("hidden")
        // Initialize only essential animations first
        initEssentialAnimations()

        // Lazy load non-essential features
        setTimeout(() => {
          if (!window.matchMedia("(max-width: 768px)").matches) {
            initBackgroundEffects()
          }
        }, 1000)
      }, 300)
    }
  }, interval)

  // Make sure resources are loaded
  window.addEventListener("load", () => {
    progress = Math.min(progress + 30, 100) // Boost progress when resources are loaded
  })

  // Initialize AOS with reduced settings
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      once: true,
      mirror: false,
      disable: window.innerWidth < 768, // Disable on mobile
    })
  }

  // Initialize GSAP if available
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger)
  }

  // Custom Cursor - only on desktop
  const cursor = document.querySelector(".cursor-dot")
  const cursorOutline = document.querySelector(".cursor-outline")
  const cursorText = document.querySelector(".cursor-text")

  // Only initialize cursor on non-touch devices
  if (!("ontouchstart" in window) && cursor && cursorOutline && cursorText) {
    let cursorVisible = false
    let cursorEnlarged = false

    const onMouseMove = (e) => {
      const mouseX = e.clientX
      const mouseY = e.clientY

      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`
      cursorOutline.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`
      cursorText.style.transform = `translate3d(${mouseX}px, ${mouseY - 30}px, 0) translate(-50%, -50%)`

      if (!cursorVisible) {
        cursor.style.opacity = 1
        cursorOutline.style.opacity = 0.5
        cursorVisible = true
      }
    }

    document.addEventListener("mousemove", onMouseMove)

    document.addEventListener("mouseenter", () => {
      cursor.style.opacity = 1
      cursorOutline.style.opacity = 0.5
      cursorVisible = true
    })

    document.addEventListener("mouseleave", () => {
      cursor.style.opacity = 0
      cursorOutline.style.opacity = 0
      cursorText.style.opacity = 0
      cursorVisible = false
    })

    // Cursor effects for interactive elements
    const cursorElements = document.querySelectorAll(
      "a, button, .project-card, .social-link, .filter-btn, .skill-category",
    )

    cursorElements.forEach((element) => {
      element.addEventListener("mouseenter", () => {
        cursor.style.transform = cursor.style.transform.replace("scale(1)", "scale(1.5)")
        cursorOutline.style.width = "6rem"
        cursorOutline.style.height = "6rem"
        cursorEnlarged = true

        const cursorTextValue = element.getAttribute("data-cursor-text")
        if (cursorTextValue) {
          cursorText.textContent = cursorTextValue
          cursorText.style.opacity = "1"
          cursorText.style.visibility = "visible"
        }
      })

      element.addEventListener("mouseleave", () => {
        cursor.style.transform = cursor.style.transform.replace("scale(1.5)", "scale(1)")
        cursorOutline.style.width = "4rem"
        cursorOutline.style.height = "4rem"
        cursorText.style.opacity = "0"
        cursorText.style.visibility = "hidden"
        cursorEnlarged = false
      })
    })
  }

  // Lightweight 3D Background with Three.js
  function initBackgroundEffects() {
    if (typeof THREE === "undefined") return

    const canvas = document.getElementById("bg-canvas")
    if (!canvas) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: false, // Disable antialiasing for performance
      powerPreference: "high-performance",
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Limit pixel ratio

    // Create particles - reduced count for performance
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = window.innerWidth < 768 ? 500 : 1000 // Reduce on mobile

    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3))

    // Materials
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x22c55e,
      transparent: true,
      opacity: 0.4,
    })

    // Mesh
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particlesMesh)

    // Position camera
    camera.position.z = 5

    // Mouse movement effect - throttled
    let mouseX = 0
    let mouseY = 0
    let lastMouseMoveTime = 0

    function onDocumentMouseMove(event) {
      const now = Date.now()
      if (now - lastMouseMoveTime < 50) return // Throttle to 20fps
      lastMouseMoveTime = now

      mouseX = (event.clientX - window.innerWidth / 2) / 100
      mouseY = (event.clientY - window.innerHeight / 2) / 100
    }

    document.addEventListener("mousemove", onDocumentMouseMove)

    // Handle window resize - throttled
    let resizeTimeout
    window.addEventListener("resize", () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }, 250)
    })

    // Animation loop - optimized
    let animationFrameId
    function animate() {
      animationFrameId = requestAnimationFrame(animate)

      particlesMesh.rotation.x += 0.0003
      particlesMesh.rotation.y += 0.0003

      // Respond to mouse movement
      particlesMesh.position.x = mouseX * 0.1
      particlesMesh.position.y = -mouseY * 0.1

      renderer.render(scene, camera)
    }

    animate()

    // Clean up function to stop animations when not visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!animationFrameId) animate()
        } else {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId)
            animationFrameId = null
          }
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(canvas)
  }

  // Initialize essential animations
  function initEssentialAnimations() {
    // Header scroll effect
    const header = document.querySelector("header")
    const backToTop = document.getElementById("backToTop")

    let lastScrollY = 0
    let scrollTimeout

    window.addEventListener("scroll", () => {
      if (scrollTimeout) return // Skip if we're throttling

      scrollTimeout = setTimeout(() => {
        if (window.scrollY > 100) {
          header.classList.add("scrolled")
          if (backToTop) {
            backToTop.style.opacity = "1"
            backToTop.style.visibility = "visible"
          }
        } else {
          header.classList.remove("scrolled")
          if (backToTop) {
            backToTop.style.opacity = "0"
            backToTop.style.visibility = "hidden"
          }
        }
        lastScrollY = window.scrollY
        scrollTimeout = null
      }, 100) // Throttle to 10 updates per second
    })

    // Mobile Navigation Toggle
    const navToggle = document.getElementById("navToggle")
    const navLinks = document.getElementById("navLinks")

    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => {
        navToggle.classList.toggle("active")
        navLinks.classList.toggle("active")
      })

      // Close mobile nav when clicking on a link
      document.querySelectorAll(".nav-links a").forEach((link) => {
        link.addEventListener("click", () => {
          navToggle.classList.remove("active")
          navLinks.classList.remove("active")
        })
      })
    }

    // Theme Toggle
    const themeToggle = document.getElementById("themeToggle")

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-theme")
        localStorage.setItem("theme", document.body.classList.contains("light-theme") ? "light" : "dark")
      })

      // Check for saved theme preference
      if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-theme")
      }
    }

    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault()

        const targetId = this.getAttribute("href")
        if (targetId === "#") return

        const targetElement = document.querySelector(targetId)
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          })
        }
      })
    })

    // Lazy load stats animation
    const stats = document.querySelectorAll(".stat-number")

    if (stats.length > 0) {
      const aboutSection = document.querySelector(".about")

      if (aboutSection) {
        const aboutObserver = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              stats.forEach((stat) => {
                const target = Number.parseInt(stat.getAttribute("data-count"))
                let count = 0
                const duration = 1500 // ms
                const frameDuration = 1000 / 30 // 30fps
                const totalFrames = Math.ceil(duration / frameDuration)
                const increment = target / totalFrames

                const counter = setInterval(() => {
                  count += increment
                  if (count >= target) {
                    stat.textContent = target
                    clearInterval(counter)
                  } else {
                    stat.textContent = Math.floor(count)
                  }
                }, frameDuration)
              })

              aboutObserver.unobserve(aboutSection)
            }
          },
          { threshold: 0.2 },
        )

        aboutObserver.observe(aboutSection)
      }
    }

    // Skill categories toggle - simplified
    const skillCategories = document.querySelectorAll(".skill-category")
    const skillLists = document.querySelectorAll(".skills-list")

    if (skillCategories.length > 0 && skillLists.length > 0) {
      skillCategories.forEach((category) => {
        category.addEventListener("click", () => {
          const target = category.getAttribute("data-category")

          // Update active category
          skillCategories.forEach((cat) => cat.classList.remove("active"))
          category.classList.add("active")

          // Show corresponding skills
          skillLists.forEach((list) => {
            list.classList.remove("active")
            if (list.getAttribute("data-skills") === target) {
              list.classList.add("active")

              // Animate skill bars
              list.querySelectorAll(".skill-progress").forEach((progress) => {
                const width = progress.getAttribute("data-width")
                progress.style.width = width
              })
            }
          })
        })
      })

      // Initialize first category skill bars
      document
        .querySelector(".skills-list.active")
        .querySelectorAll(".skill-progress")
        .forEach((progress) => {
          const width = progress.getAttribute("data-width")
          setTimeout(() => {
            progress.style.width = width
          }, 500)
        })
    }

    // Project filtering - simplified
    const filterBtns = document.querySelectorAll(".filter-btn")
    const projectItems = document.querySelectorAll(".project-item")

    if (filterBtns.length > 0 && projectItems.length > 0) {
      filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          // Update active button
          filterBtns.forEach((b) => b.classList.remove("active"))
          btn.classList.add("active")

          const filter = btn.getAttribute("data-filter")

          // Filter projects
          projectItems.forEach((item) => {
            if (filter === "all" || item.classList.contains(filter)) {
              item.style.display = "block"
              setTimeout(() => {
                item.style.opacity = "1"
                item.style.transform = "scale(1)"
              }, 50)
            } else {
              item.style.opacity = "0"
              item.style.transform = "scale(0.8)"
              setTimeout(() => {
                item.style.display = "none"
              }, 300)
            }
          })
        })
      })
    }

    // Modal functionality - simplified
    const modalTriggers = document.querySelectorAll(".modal-trigger")
    const modals = document.querySelectorAll(".modal")
    const modalCloses = document.querySelectorAll(".modal-close")

    if (modalTriggers.length > 0 && modals.length > 0) {
      modalTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (e) => {
          e.preventDefault()
          const target = trigger.getAttribute("href")
          const modal = document.querySelector(target)

          if (modal) {
            modal.classList.add("active")
            document.body.style.overflow = "hidden"
          }
        })
      })

      modalCloses.forEach((close) => {
        close.addEventListener("click", () => {
          const modal = close.closest(".modal")
          modal.classList.remove("active")
          document.body.style.overflow = ""
        })
      })

      // Close modal when clicking outside
      modals.forEach((modal) => {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.classList.remove("active")
            document.body.style.overflow = ""
          }
        })
      })
    }

    // Load demo iframe - lazy loading
    const loadDemoBtns = document.querySelectorAll(".load-demo")

    if (loadDemoBtns.length > 0) {
      loadDemoBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const demoPlaceholder = btn.closest(".demo-placeholder")
          const iframe = demoPlaceholder.previousElementSibling
          const src = iframe.getAttribute("data-src")

          iframe.setAttribute("src", src)
          demoPlaceholder.style.display = "none"
        })
      })
    }

    // Color Palette Generator - simplified
    const generatePaletteBtn = document.getElementById("generatePalette")
    const colorSwatches = document.querySelectorAll(".color-swatch")

    if (generatePaletteBtn && colorSwatches.length > 0) {
      function generateRandomColor() {
        const letters = "0123456789ABCDEF"
        let color = "#"
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)]
        }
        return color
      }

      generatePaletteBtn.addEventListener("click", () => {
        colorSwatches.forEach((swatch) => {
          const color = generateRandomColor()
          swatch.style.backgroundColor = color
          swatch.setAttribute("title", `Click to copy: ${color}`)
        })
      })

      colorSwatches.forEach((swatch) => {
        swatch.addEventListener("click", () => {
          const color = swatch.style.backgroundColor
          const tempInput = document.createElement("input")
          document.body.appendChild(tempInput)
          tempInput.value = rgb2hex(color)
          tempInput.select()
          document.execCommand("copy")
          document.body.removeChild(tempInput)

          // Show feedback
          const originalTitle = swatch.getAttribute("title")
          swatch.setAttribute("title", "Copied!")
          setTimeout(() => {
            swatch.setAttribute("title", originalTitle)
          }, 1000)
        })
      })

      // Convert RGB to HEX
      function rgb2hex(rgb) {
        if (rgb.startsWith("#")) return rgb

        rgb = rgb.match(/^rgb$$(\d+),\s*(\d+),\s*(\d+)$$$/)
        if (!rgb) return "#000000"

        function hex(x) {
          return ("0" + Number.parseInt(x).toString(16)).slice(-2)
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3])
      }
    }

    // Simplified Memory Game
    const memoryGrid = document.getElementById("memoryGrid")
    const moveCount = document.getElementById("moveCount")
    const resetMemoryBtn = document.getElementById("resetMemory")

    if (memoryGrid && moveCount && resetMemoryBtn) {
      const symbols = ["♠", "♥", "♦", "♣", "★", "✿", "♫", "☀"]
      const cards = [...symbols, ...symbols]
      let flippedCards = []
      let matchedPairs = 0
      let moves = 0

      // Shuffle cards
      function shuffleCards() {
        for (let i = cards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[cards[i], cards[j]] = [cards[j], cards[i]]
        }
      }

      // Create memory cards
      function createMemoryGame() {
        memoryGrid.innerHTML = ""
        matchedPairs = 0
        moves = 0
        moveCount.textContent = moves
        flippedCards = []

        shuffleCards()

        cards.forEach((symbol, index) => {
          const card = document.createElement("div")
          card.classList.add("memory-card")
          card.dataset.symbol = symbol
          card.dataset.index = index

          card.addEventListener("click", flipCard)

          memoryGrid.appendChild(card)
        })
      }

      // Flip card
      function flipCard() {
        if (flippedCards.length === 2) return
        if (this.classList.contains("flipped")) return

        this.classList.add("flipped")
        this.textContent = this.dataset.symbol
        flippedCards.push(this)

        if (flippedCards.length === 2) {
          moves++
          moveCount.textContent = moves

          if (flippedCards[0].dataset.symbol === flippedCards[1].dataset.symbol) {
            // Match found
            matchedPairs++
            flippedCards = []

            if (matchedPairs === symbols.length) {
              setTimeout(() => {
                alert(`Congratulations! You completed the game in ${moves} moves.`)
              }, 500)
            }
          } else {
            // No match
            setTimeout(() => {
              flippedCards.forEach((card) => {
                card.classList.remove("flipped")
                card.textContent = ""
              })
              flippedCards = []
            }, 1000)
          }
        }
      }

      // Reset game
      resetMemoryBtn.addEventListener("click", createMemoryGame)

      // Initialize memory game
      createMemoryGame()
    }

    // Contact form submission - simplified
    const contactForm = document.getElementById("contactForm")

    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault()

        const submitBtn = contactForm.querySelector(".submit-btn")
        const originalText = submitBtn.innerHTML

        submitBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>'
        submitBtn.disabled = true

        // Simulate form submission
        setTimeout(() => {
          alert("Message sent successfully! I will get back to you soon.")
          contactForm.reset()
          submitBtn.innerHTML = originalText
          submitBtn.disabled = false
        }, 1000)
      })
    }

    // Simple animations for hero section
    const heroElements = [
      { selector: ".hero-intro", delay: 300 },
      { selector: ".hero-name", delay: 500 },
      { selector: ".hero-roles", delay: 700 },
      { selector: ".hero-description", delay: 900 },
      { selector: ".hero-cta", delay: 1100 },
    ]

    heroElements.forEach((item) => {
      const element = document.querySelector(item.selector)
      if (element) {
        element.style.opacity = "0"
        element.style.transform = "translateY(20px)"

        setTimeout(() => {
          element.style.transition = "opacity 0.8s ease, transform 0.8s ease"
          element.style.opacity = "1"
          element.style.transform = "translateY(0)"
        }, item.delay)
      }
    })
  }
})

