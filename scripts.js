// يخفي شاشة التحميل بعد ما تجهز كل موارد الصفحة (صور/خطوط...)، بتأخير بسيط عشان ما تومض بسرعة
window.addEventListener("load", () => {
  const loader = document.getElementById("pageLoader");
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add("loader-hidden");
    setTimeout(() => loader.remove(), 450);
  }, 2500);
});

// رابط ويب هوك ديسكورد — من إعدادات القناة: Integrations > Webhooks > New Webhook > Copy URL
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1568600977345486979/GkEMGj_kcrJ1udn1IZz9z4AV1q7_w_C87VVa6XW9C9CIS_isZoyu6RcYLDcyu5AEY6S1";

// فروع المعرض بإحداثياتها (خط العرض/الطول) — عدّلها حسب فروعك الفعلية
const BRANCHES = [
  { name: "فرع الرياض", lat: 24.7136, lng: 46.6753 },
  { name: "فرع جدة", lat: 21.4858, lng: 39.1925 },
  { name: "فرع الدمام", lat: 26.4207, lng: 50.0888 },
  { name: "فرع مكة المكرمة", lat: 21.3891, lng: 39.8579 },
  { name: "فرع المدينة المنورة", lat: 24.5247, lng: 39.5692 },
];

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// صيغة Haversine لحساب المسافة بين نقطتين على الكرة الأرضية (بالكيلومتر)
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestBranch(lat, lng) {
  return BRANCHES.map((b) => ({ ...b, distance: distanceKm(lat, lng, b.lat, b.lng) })).sort(
    (a, b) => a.distance - b.distance
  )[0];
}

// معلومات الجهاز/المتصفح — وصفية فقط للتوعية، مو وسيلة حماية فعلية
// (أي قيمة من المتصفح ممكن المستخدم يزوّرها، فما تعتمد عليها كتحقق أمني حقيقي)
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  return {
    type: isMobile ? "جوال" : "كمبيوتر",
    userAgent: ua,
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || "—",
    referrer: document.referrer || "دخول مباشر",
  };
}

// يبني رسالة Discord Embed ويرسلها مباشرة لرابط الويب هوك
// title: يفرّق بين إشعار "زيارة جديدة" (أول ما يدخل الموقع) وإشعار "طلب جديد" (بعد تعبئة الفورم)
async function sendToDiscord(payload, title = "طلب جديد من موقع النخبة للسيارات") {
  const mapLink = payload.lat && payload.lng ? `https://maps.google.com/?q=${payload.lat},${payload.lng}` : "غير متوفر";
  const device = getDeviceInfo();

  const fields = [];
  if (payload.name) fields.push({ name: "الاسم", value: payload.name, inline: true });
  if (payload.phone) fields.push({ name: "الهاتف", value: payload.phone, inline: true });
  if (payload.email) fields.push({ name: "البريد", value: payload.email, inline: true });
  fields.push({ name: "الفرع الأقرب", value: payload.branch || "—", inline: true });
  fields.push({ name: "IP", value: payload.clientIp || "—", inline: true });
  fields.push({ name: "نوع الجهاز", value: device.type, inline: true });
  fields.push({ name: "الموقع", value: mapLink, inline: false });
  if (payload.message) fields.push({ name: "الرسالة", value: payload.message, inline: false });
  fields.push({ name: "تفاصيل الجهاز", value: `اللغة: ${device.language} · الشاشة: ${device.screen} · المصدر: ${device.referrer}`, inline: false });
  fields.push({ name: "User Agent", value: "```" + device.userAgent.slice(0, 500) + "```", inline: false });

  const discordPayload = {
    embeds: [
      {
        title,
        color: 0x0d6efd,
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: { parse: [] }, // يمنع أي @everyone/@here يكتبه المستخدم من عمل منشن فعلي بالقناة
  };

  return fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discordPayload),
  });
}

// يجلب عنوان الـ IP العام للزائر عن طريق Fetch API (Request/Response)
async function fetchPublicIP() {
  try {
    const request = new Request("https://api.ipify.org?format=json");
    const response = await fetch(request);
    if (!response.ok) throw new Error("فشل طلب عنوان IP");
    const data = await response.json();
    return data.ip;
  } catch (err) {
    console.warn("تعذر جلب عنوان IP:", err);
    return null;
  }
}

function updateBranchUI(branch) {
  const info = document.getElementById("branchInfo");
  const select = document.getElementById("branchSelect");
  if (info) {
    info.textContent = `أقرب فرع لك: ${branch.name} (${branch.distance.toFixed(1)} كم تقريبًا)`;
  }
  if (select) {
    select.value = branch.name;
  }
}

// يرجع Promise بالإحداثيات (أو null لو المستخدم رفض/المتصفح ما يدعم) عشان ننتظرها قبل إرسال إيمبد الزيارة
function getLocation() {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const ipField = document.getElementById("clientIp");
  const latField = document.getElementById("clientLat");
  const lngField = document.getElementById("clientLng");
  const info = document.getElementById("branchInfo");

  const ip = await fetchPublicIP();
  if (ip && ipField) ipField.value = ip;

  const loc = await getLocation();
  let branch = null;
  if (loc) {
    branch = nearestBranch(loc.lat, loc.lng);
    updateBranchUI(branch);
    if (latField) latField.value = loc.lat;
    if (lngField) lngField.value = loc.lng;
  } else if (info) {
    info.textContent = "فعّل خدمة الموقع لعرض أقرب فرع تلقائيًا، أو اختره يدويًا.";
  }

  // إيمبد فوري بمجرد دخول الزائر للموقع، قبل أي تعبئة فورم
  sendToDiscord(
    {
      clientIp: ip,
      lat: loc ? loc.lat : null,
      lng: loc ? loc.lng : null,
      branch: branch ? branch.name : null,
    },
    "زيارة جديدة لموقع النخبة للسيارات"
  ).catch((err) => console.warn("تعذر إرسال إشعار الزيارة:", err));

  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        name: form.querySelector('[name="name"]').value,
        phone: form.querySelector('[name="phone"]').value,
        email: form.querySelector('[name="email"]').value,
        message: form.querySelector('[name="message"]').value,
        branch: document.getElementById("branchSelect")?.value,
        clientIp: ipField ? ipField.value : null,
        lat: document.getElementById("clientLat")?.value || null,
        lng: document.getElementById("clientLng")?.value || null,
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "جارٍ الإرسال…";

      try {
        const res = await sendToDiscord(payload);
        if (!res.ok) throw new Error("فشل الإرسال");
        alert("تم استلام طلبك، بنتواصل معك قريبًا.");
        form.reset();
      } catch (err) {
        console.error("تعذر إرسال الطلب:", err);
        alert("صار خطأ أثناء إرسال الطلب، حاول مرة ثانية أو تواصل معنا عبر واتساب.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});
