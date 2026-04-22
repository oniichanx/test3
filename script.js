const gallery=document.getElementById("gallery")
const lightbox=document.getElementById("lightbox")
const lightboxImg=document.getElementById("lightbox-img")
const prev=document.getElementById("prev")
const next=document.getElementById("next")
const download=document.getElementById("download")

const topBtn=document.getElementById("topBtn")
const themeBtn=document.getElementById("themeBtn")

let images=[]
let index=0
let currentFilter="all"

/* นับวัน */
function getDaysAgo(dateString){
  const today = new Date()
  const uploadDate = new Date(dateString)
  today.setHours(0,0,0,0)
  uploadDate.setHours(0,0,0,0)
  const diff = today - uploadDate
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/* detect orientation จาก natural size ของรูป */
function getOrientation(w,h){
  const ratio = w/h
  if(ratio > 1.2) return "landscape"      // แนวนอน
  if(ratio < 0.85) return "portrait"      // แนวตั้ง
  return "mobile"                          // มือถือ (สี่เหลี่ยมจัตุรัส / ใกล้เคียง)
}

/* filter buttons */
function setupFilters(){
  const bar = document.getElementById("filterBar")
  const filters = [
    { key:"all",      label:"🖼️ ทั้งหมด" },
    { key:"landscape",label:"🖥️ แนวนอน" },
    { key:"portrait", label:"📱 แนวตั้ง" },
    { key:"mobile",   label:"🔲 มือถือ" },
  ]
  filters.forEach(f=>{
    const btn = document.createElement("button")
    btn.className="filter-btn" + (f.key==="all" ? " active" : "")
    btn.dataset.key=f.key
    btn.innerText=f.label
    btn.onclick=()=>{
      currentFilter=f.key
      document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"))
      btn.classList.add("active")
      applyFilter()
    }
    bar.appendChild(btn)
  })
}

function applyFilter(){
  document.querySelectorAll(".card").forEach(card=>{
    const ori=card.dataset.orientation
    if(currentFilter==="all" || ori===currentFilter){
      card.style.display=""
    }else{
      card.style.display="none"
    }
  })
  /* rebuild lightbox index from visible cards */
  rebuildIndex()
}

/* rebuild images index สำหรับ lightbox ให้ตรงกับ filter */
function rebuildIndex(){
  /* อัพเดท onclick ของแต่ละ card ให้ index ถูก */
  const visible = [...document.querySelectorAll(".card")].filter(c=>c.style.display!=="none")
  visible.forEach((card,i)=>{
    card.onclick=()=>{
      index=i
      const imgArr = visible.map(c=>c.dataset.url)
      openImageDirect(imgArr[i])
      currentVisible=imgArr
    }
  })
}

let currentVisible=[]

function openImageDirect(url){
  lightbox.style.display="flex"
  lightboxImg.src="wallpaper/"+url
  download.href="wallpaper/"+url
}

/* load images */
fetch("images.json")
.then(res=>res.json())
.then(data=>{

  images=data

  /* กัน duplicate */
  images = images.filter((v,i,a)=>
    a.findIndex(t=>t.url===v.url)===i
  )

  /* เรียงใหม่สุดก่อน */
  images.sort((a,b)=> new Date(b.date)-new Date(a.date))

  setupFilters()

  let loadedCount=0

  images.forEach((file,i)=>{

    const card=document.createElement("div")
    card.className="card"
    card.dataset.url=file.url

    const img=document.createElement("img")
    img.loading="lazy"
    img.decoding="async"
    img.src="wallpaper/"+file.url

    img.onload=()=>{
      img.classList.add("loaded")

      /* detect orientation หลังรูปโหลด */
      const ori = getOrientation(img.naturalWidth, img.naturalHeight)
      card.dataset.orientation=ori

      /* badge orientation */
      const oriBadge=document.createElement("div")
      oriBadge.className="ori-badge ori-"+ori
      if(ori==="landscape") oriBadge.innerText="🖥️"
      else if(ori==="portrait") oriBadge.innerText="📱"
      else oriBadge.innerText="🔲"
      card.appendChild(oriBadge)

      loadedCount++
      if(loadedCount===images.length) rebuildIndex()
    }

    img.onerror=()=>card.remove()

    const tag=document.createElement("div")
    tag.className="tag"
    const folder = file.url.split("/")[0]
    tag.innerText = `${folder} • ${file.type}`

    const overlay=document.createElement("div")
    overlay.className="overlay"
    const daysAgo = file.date ? getDaysAgo(file.date) : null
    if(daysAgo===null) overlay.innerText="⚠️ Unknown"
    else if(daysAgo===0) overlay.innerText="🟢 Today"
    else if(daysAgo===1) overlay.innerText="🕒 1 day ago"
    else overlay.innerText=`🕒 ${daysAgo} days ago`

    card.append(img,tag,overlay)
    gallery.appendChild(card)

    card.onclick=()=>{
      const visible=[...document.querySelectorAll(".card")].filter(c=>c.style.display!=="none")
      currentVisible=visible.map(c=>c.dataset.url)
      index=visible.indexOf(card)
      openImageDirect(currentVisible[index])
    }

  })

})

/* lightbox nav */
prev.onclick=()=>{
  index--
  if(index<0) index=currentVisible.length-1
  openImageDirect(currentVisible[index])
}

next.onclick=()=>{
  index++
  if(index>=currentVisible.length) index=0
  openImageDirect(currentVisible[index])
}

lightbox.onclick=e=>{
  if(e.target===lightbox) lightbox.style.display="none"
}

document.addEventListener("keydown",e=>{
  if(e.key==="Escape") lightbox.style.display="none"
  if(e.key==="ArrowRight") next.click()
  if(e.key==="ArrowLeft") prev.click()
})

/* scroll top */
window.addEventListener("scroll",()=>{
  topBtn.style.display = window.scrollY>400 ? "flex" : "none"
})

topBtn.onclick=()=>{
  window.scrollTo({top:0,behavior:"smooth"})
}

/* theme */
if(localStorage.theme==="light"){
  document.body.classList.add("light")
  themeBtn.innerText="☀️"
}

themeBtn.onclick=()=>{
  document.body.classList.toggle("light")
  if(document.body.classList.contains("light")){
    themeBtn.innerText="☀️"
    localStorage.theme="light"
  }else{
    themeBtn.innerText="🌙"
    localStorage.theme="dark"
  }
}