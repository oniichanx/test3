const gallery    = document.getElementById("gallery")
const lightbox   = document.getElementById("lightbox")
const lightboxImg= document.getElementById("lightbox-img")
const prev       = document.getElementById("prev")
const next       = document.getElementById("next")
const download   = document.getElementById("download")
const topBtn     = document.getElementById("topBtn")
const themeBtn   = document.getElementById("themeBtn")
const filterFab  = document.getElementById("filterFab")
const filterPopup= document.getElementById("filterPopup")

let images = []
let index  = 0
let currentFilter = "all"
let currentVisible = []

/* ── utils ── */

function getDaysAgo(dateString){
  const today      = new Date()
  const uploadDate = new Date(dateString)
  today.setHours(0,0,0,0)
  uploadDate.setHours(0,0,0,0)
  return Math.floor((today - uploadDate) / 86400000)
}

function getOrientation(w,h){
  const r = w/h
  if(r > 1.2)  return "landscape"
  if(r < 0.85) return "portrait"
  return "mobile"
}

/* ── filter FAB toggle ── */

filterFab.onclick = e => {
  e.stopPropagation()
  filterPopup.classList.toggle("open")
}

document.addEventListener("click", e => {
  if(!filterPopup.contains(e.target) && e.target !== filterFab){
    filterPopup.classList.remove("open")
  }
})

/* ── filter popup buttons ── */

document.querySelectorAll(".fpBtn").forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.key
    document.querySelectorAll(".fpBtn").forEach(b => b.classList.remove("active"))
    btn.classList.add("active")
    applyFilter()
    filterPopup.classList.remove("open")
  }
})

function applyFilter(){
  document.querySelectorAll(".card").forEach(card => {
    const ori = card.dataset.orientation
    card.style.display =
      (currentFilter === "all" || ori === currentFilter) ? "" : "none"
  })
  rebuildVisible()
}

function rebuildVisible(){
  currentVisible = [...document.querySelectorAll(".card")]
    .filter(c => c.style.display !== "none")
    .map(c => c.dataset.url)
}

/* ── load images ── */

fetch("images.json")
.then(res => res.json())
.then(data => {

  images = data.filter((v,i,a) => a.findIndex(t => t.url === v.url) === i)
  images.sort((a,b) => new Date(b.date) - new Date(a.date))

  images.forEach(file => {

    const card = document.createElement("div")
    card.className = "card"
    card.dataset.url = file.url

    const img = document.createElement("img")
    img.loading  = "lazy"
    img.decoding = "async"
    img.src      = "wallpaper/" + file.url

    img.onload = () => {
      img.classList.add("loaded")

      const ori = getOrientation(img.naturalWidth, img.naturalHeight)
      card.dataset.orientation = ori

      const badge = document.createElement("div")
      badge.className = "ori-badge ori-" + ori
      badge.innerText = ori==="landscape" ? "🖥️" : ori==="portrait" ? "📱" : "🔲"
      card.appendChild(badge)

      rebuildVisible()
    }

    img.onerror = () => card.remove()

    const tag = document.createElement("div")
    tag.className = "tag"
    tag.innerText = `${file.url.split("/")[0]} • ${file.type}`

    const overlay = document.createElement("div")
    overlay.className = "overlay"
    const d = file.date ? getDaysAgo(file.date) : null
    overlay.innerText = d===null ? "⚠️ Unknown"
      : d===0 ? "🟢 Today"
      : d===1 ? "🕒 1 day ago"
      : `🕒 ${d} days ago`

    card.append(img, tag, overlay)
    gallery.appendChild(card)

    card.onclick = () => {
      rebuildVisible()
      index = currentVisible.indexOf(file.url)
      openImage(currentVisible[index])
    }

  })

})

/* ── lightbox ── */

function openImage(url){
  lightbox.style.display = "flex"
  lightboxImg.src  = "wallpaper/" + url
  download.href    = "wallpaper/" + url
}

prev.onclick = () => {
  index = (index - 1 + currentVisible.length) % currentVisible.length
  openImage(currentVisible[index])
}

next.onclick = () => {
  index = (index + 1) % currentVisible.length
  openImage(currentVisible[index])
}

lightbox.onclick = e => {
  if(e.target === lightbox) lightbox.style.display = "none"
}

document.addEventListener("keydown", e => {
  if(e.key === "Escape")      lightbox.style.display = "none"
  if(e.key === "ArrowRight")  next.click()
  if(e.key === "ArrowLeft")   prev.click()
})

/* ── scroll top ── */

window.addEventListener("scroll", () => {
  topBtn.style.display = window.scrollY > 400 ? "flex" : "none"
})

topBtn.onclick = () => window.scrollTo({top:0, behavior:"smooth"})

/* ── theme ── */

if(localStorage.theme === "light"){
  document.body.classList.add("light")
  themeBtn.innerText = "☀️"
}

themeBtn.onclick = () => {
  document.body.classList.toggle("light")
  const isLight = document.body.classList.contains("light")
  themeBtn.innerText   = isLight ? "☀️" : "🌙"
  localStorage.theme   = isLight ? "light" : "dark"
}