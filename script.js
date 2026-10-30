const vehiclePhotos = {
  SUV:"https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
  Sedan:"https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=85",
  Hatchback:"https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=85",
  Pickup:"https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
  Minivan:"https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=85",
  Electric:"https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=85"
};

const vehiclePhotoOverrides = {
  "toyota-corolla":"https://content.homenetiol.com/2000157/2065512/0x0/stock_images/8/2025TOC04_640/2025TOC042038825_640_05.jpg",
  "toyota-corolla-cross":"https://uc.udn.com.tw/photo/2020/07/09/99/8159885.jpg",
  "toyota-rav4":"https://www.dubicars.com/images/9e9da4/w_1300x760/al-madina-cars-fze/94ef3593-885f-42d3-a675-3c01ecb5c767.jpeg",
  "toyota-harrier":"https://webcg.ismcdn.jp/mwimgs/6/b/1200/img_6b2690fb24049072937dfdfadedda4cb98756.jpg",
  "toyota-land-cruiser-prado":"https://camry-drive.ru/wp-content/uploads/2023/08/2024-toyota-land-cruiser-exterior-front-view-camry-drive.ru_-1536x864.jpg",
  "toyota-land-cruiser-300":"https://cdn1.unegui.mn/media/cache1/c9/72/c972df3f66481d58d36f265794353d9e.jpg",
  "toyota-hilux":"https://img.chceauto.pl/toyota/hilux/toyota-hilux-pickup-4456-48897_v1.jpg",
  "toyota-rush":"https://static.promediateknologi.id/crop/0x0%3A0x0/1200x0/webp/photo/p1/416/2025/01/20/WhatsApp-Image-2025-01-17-at-211024-619120403.jpeg",
  "toyota-vitz":"https://carsguide.ikman.lk/wp-content/uploads/2024/07/vitz-featured.jpg",
  "toyota-yaris":"https://images.carexpert.com.au/crop/1398/930/cms/v1/media/2025-04-2025-toyota-yaris-zr-4.jpg",
  "toyota-noah":"https://s3-ap-southeast-2.amazonaws.com/nichibo/678357_d10b9a1f7f.jpg",
  "toyota-fortuner":"https://dhzc82x38ceu.cloudfront.net/Prod/Stock_Item__c/a1pP2000003BTMjIAO/Image/1773848845274_1.jpeg",
  "toyota-starlet-cross":"https://img-ik.cars.co.za/news-site-za/images/2024/07/Toyota_StarletCross05.jpg?tr=w-800",
  "toyota-prius":"https://www.autoblog.com/.image/MjEyNTgwMzEyODIyMTMwMTg1/2025-toyota-prius-limited-4-128589.jpg?profile=w2560",
  "byd-seal":"https://images.openai.com/static-rsc-4/366cPpOfYm5xlEhPTwUxNgXV1P1AKw7Xnb0xBikhHHW2Cu2GfQ5iNL1XkGC8jegqkNoNlCWQshOAOeBemZsa7qW30QnOH1asdQzmuGH-T84D4PlnwIGstoqojybQtSus2JviXlp1QdZ2ojt9uKqwHD22TyyTDZu9YZqoJlPwTxw?purpose=inline",
  "byd-atto-3":"https://images.openai.com/static-rsc-4/Z4yKaFpwDCHv98oxhze9j8-ORmgyFw-4Kufi7WhsWS-EcSlg6qvw0ukNpmYqGg9fB4pXTP0Bf9V2YrRRpyk26wIJCsfhYDacYAD63IQFx1O9wqoKHIlVBINjbcL_xlkoPYmtHLA07s-SnCDdO43-YNUXPmJTH6iFRFIqenWpkTA?purpose=inline",
  "byd-song-plus":"https://images.openai.com/static-rsc-4/Lc7oYeBlf8yvPG_4J-DmH2rc30_4PAi7jIzysnP2-Gm1DbX_f41PfSC9CpelmrEThRi0Lb11NqiXeJC5XUaZ69tA7kyQ7FYihO_LHyfw5KGWYZO9ObYlCxjCOc_da0lkYey6Zq_m-HUPaIHfbZPyil5RDymFmUn1aIXli5Ij7SU?purpose=inline",
  "byd-dolphin":"https://images.openai.com/static-rsc-4/URhb91Flhtp7K0O2-bB4Nr0ftsAynsHlbiFbq9xsAjl5KJILVzMom-oNKdiFYyHHt-ooqse3vXi-mImj1_1T5GKa1iwSMLRrIGu-tdjvOxUALtZaSiIFJdltcYfiqaiW3d7gKF9C7ZXwGo0oCm_z8cO10kAjq4Xjm5Bc6Du4ZGM?purpose=inline",
  "byd-shark-6":"https://images.openai.com/static-rsc-4/b-14GSSAleeT5smSZZ2SFGA8HFY0qBR01t_JlqHZLrXG0S9vnyRw4NKv7RACIYpFye16rdDRNBH7SaV6iW8WAyw--zs9NbId8lXnzJlsh7crtpSQKBaGaU2WNLeyvpQfkAJgT3CV8ZgbhBUMWxYEKqZoPjefAG4Jlsg3h9RmqwQ?purpose=inline",
  "byd-leopard-5":"https://images.openai.com/static-rsc-4/zwVvtrk434KGG-WlEK6UilOgJ00C0l5I0Q5KSjJ2QYevEXMMjzEaK6819h3PMwslKfQ2VUlP__i323PFp4dluQsySn-5nW1q_Erq-Bx4M4eLhhgDEFZNxHawY4wyu1IDoYmlRwmPO67pT55r6YlQyws-7M1vERBC0YmOCEvIb0?purpose=inline",
  "byd-leopard-8":"https://images.openai.com/static-rsc-4/0p1F4eMccameVbeoBKbVL5BhJVhRm_lRFH-OZyFz9FC6_bs_2e7HS-DpLYPmTb8mX8PzAsnWGEe4x-FPZsISSMAi2CLuSxcZtqjscgRS6mvNNGXNbqEtRyMvQMn3vO5eD0W8lB1xiPpO3Ye9pE1VyTdqn7lOChaUE7KDZdK4jyU?purpose=inline",
  "byd-tang-l":"https://images.openai.com/static-rsc-4/kITjhcBjt5cf822E6xCXnobJlmLcralDwQsfBePzJGcd62PuhCh37treVf0bGww6A3g_9q3DBrt1PYLLJuBsUEA89muQWfl1ccwq1HtoT1n7CuovM-kHmpWG3WLqMTOOOHHEp3WTOkmZoIPQdVkF7dSta2D_BTVFn0nvjaMXBiA?purpose=inline",
  "byd-yuan-up":"https://images.openai.com/static-rsc-4/i6mxaBggnAJpVTI6i57iYnpOQ_ta1C4wdbW_RXREdLkFkhpRI3Uv_TPTDOI0uJGLZpeTlOVN9Y3Js6LbhdDk_k5ubkTswVFYnlEcCPXpbKBPUQtNeuZXOc-CdLQAoGmIIeNdYFoQTJ6rSigs_LqcCGVcRGPESkT8KYeIo?purpose=inline",
  "byd-atto-2":"https://images.openai.com/static-rsc-4/RCx2uRDX_ApwW4wkxoXuaZAanGuoaEed1juJRGnCflFYWnLxClvH3JnPZFojqwqy2btPkGCUJFNWxLUUkP3JNFdTJev_84VxBnlnVKvaxBS1_CueX1yD86slb2KElxJ6PhX_uxoUPSQYh62rLwPkDJTk6Mj28GkZhmaJHMmtC2c?purpose=inline",
  "byd-sealion-7":"https://images.openai.com/static-rsc-4/hC0znwPKYT-vqyV5LTUsUqmqD-tAeWTD-_X0KKo94RRdVp_Hn1G2t_389NmUfLt_T_elctz0RxLQMGQ2_CVZBKvoOByTA4TeEYoS2GaBorZhi4JA7HSYkwqNYamq2Zmk9IixzYOgLGsr3m3f6XGiWeUtBs0G83dexNODDEeo4oplw?purpose=inline",
  "byd-atto-8":"https://images.openai.com/static-rsc-4/itN2aMv5rE3YBERZgxntf7u7WnjKBKnWh_PwKxXN_GQVc9KTYsvftu62pHfuqyF7YbDunEdNKW4cMAwWYHi9z-1Z6dEM8qYK_XnlZj46Lxl2eaeFxb5H7v-VKN2Vm49-FZyjE4UjKW-V6F_qpUj36_lY8uy1PyqUozskzeJHvg0?purpose=inline",
  "geely-riddara-rd6":"https://www.geely.ae/_next/image?q=90&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F8aq74th9%2Fproduction%2F0025ef09f85a5ca985678f6da6b4970f748661ca-950x730.jpg%3Ffit%3Dmax%26auto%3Dformat&w=3840",
  "nissan-x-trail":"https://img.goo-net.com/sss/magazine/2026/05/16/1778929579.jpg",
  "nissan-terra":"https://lhd.vigo4u.com/assets/product_photos/A-503/68ad799c2dd05.jpg",
  "nissan-navara":"https://allcarsph.com/cdn/shop/files/rn-image_picker_lib_temp_836bb766-9ecb-40ab-8104-2e09975fbd49.jpg?v=1771912923&width=1946",
  "suzuki-swift":"https://www.wakalatqatar.com/cars-blocks-details/9552.webp",
  "suzuki-jimny":"https://img.supercarros.com/AdsPhotos/1024x768/0/13483541.jpg?wmo=378b314e178cd92ae0c2b3b7c3a64e2d2152b2f7c3adee4b8aca0827e05fc2bd2fddf888054c9c3710404a66ecf592c79923d174668eed42fc0beb88ed5a5400",
  "suzuki-grand-vitara":"https://www.dubicars.com/images/a9c459/w_1300x760/milele-motors/5e6744f7-987d-4a03-a6bf-9225e18e52e6.jpeg",
  "hyundai-tucson":"https://lachispa.mx/wp-content/uploads/2024/07/%C2%BFCuando-llega-a-Mexico-la-Hyundai-Tucson-2025_.png",
  "hyundai-santa-fe":"https://acnews.blob.core.windows.net/imgnews/large/NAZ_3e561299ae0549b391222105e8eafe0c.webp",
  "kia-sportage":"https://res.rac.com.au/rac-horizons/image/upload/c_limit%2Cw_3840/f_auto/q_auto%3Aeco/v1763109187/Kia_Sportage_1_test_drive_2025_n6cznc?_a=BAVMn6AQ0",
  "kia-sorento":"https://img.autotrader.co.za/39176607/Crop860x650",
  "volkswagen-polo":"https://www.arackarsilastirma.com/images/cars/2_2_4c54e_1.jpg",
  "volkswagen-tiguan":"https://hips.hearstapps.com/hmg-prod/images/2025-volkswagen-tiguan-exterior-106-6509acb88d3a7.jpg?crop=1xw%3A1xh%3Bcenter%2Ctop",
  "volkswagen-teramont":"https://syarah.com/carsguide/wp-content/uploads/2025/08/%D9%81%D9%88%D9%84%D9%83%D8%B3-%D9%88%D8%A7%D8%AC%D9%86-%D8%AA%D9%8A%D8%B1%D8%A7%D9%85%D9%88%D9%86%D8%AA-2025-2.webp",
  "subaru-forester":"https://static.thairath.co.th/media/B6FtNKtgSqRqbnNsbQWXxhTjIpORpbHYIZsFxMp4wVxEdGrdFt4kOHfIavMJz7vEDhBJu.jpg",
  "honda-fit":"https://sbimotor.com/uploads/car/images/112786/3539851_big_da8fb0f8.jpg",
  "changan-hunter":"https://cdn.autopapo.com.br/box/uploads/2022/09/02183303/changan_hunter-azul-frente-parada.jpeg",
  "foton-tunland-v9":"https://planetcars.com.br/wp-content/uploads/2024/07/tunland-2.webp",
  "leapmotor-c10":"https://www.chasingcars.com.au/wp-content/uploads/2025/01/Leapmotor-C10-Design-2025-34.jpg"
};

const SAMPLE_USD_TO_RWF_RATE = 1476.19;

function makeVehicle(make, model, type, dailyRate, power = "Petrol", photoUrl = "") {
  const photoType = vehiclePhotos[type] ? type : type === "Crossover" ? "SUV" : type === "Hybrid" ? "SUV" : "Sedan";
  const id = `${make}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g,"-");
  const image = photoUrl || vehiclePhotoOverrides[id] || vehiclePhotos[photoType];
  return {
    id,
    make, model, type, dailyRate:Math.round(dailyRate * SAMPLE_USD_TO_RWF_RATE / 1000) * 1000, seats:type === "Pickup" ? 5 : type === "Minivan" ? 7 : type === "Coupe" ? 2 : 5,
    available:true, mileage:"Ask for details", fuel:power, transmission:"Automatic",
    image,
    fallbackImage:vehiclePhotos[photoType],
    alt:`${make} ${model}`,
    tag:power === "Electric" ? "ELECTRIC" : type.toUpperCase(),
    description:`${make} ${model} rental. Contact our team to confirm the exact vehicle specification, availability, and rental terms for your dates.`
  };
}

const vehicles = [
  makeVehicle("Toyota","Corolla","Sedan",55),
  makeVehicle("Toyota","Corolla Cross","SUV",70,"Hybrid"),
  makeVehicle("Toyota","RAV4","SUV",75,"Hybrid"),
  makeVehicle("Toyota","Harrier","SUV",90,"Hybrid"),
  makeVehicle("Toyota","Land Cruiser Prado","SUV",180),
  makeVehicle("Toyota","Land Cruiser 300","SUV",240),
  makeVehicle("Toyota","Hilux","Pickup",110),
  makeVehicle("Toyota","Rush","SUV",65),
  makeVehicle("Toyota","Vitz","Hatchback",40),
  makeVehicle("Toyota","Yaris","Hatchback",45),
  makeVehicle("Toyota","Noah","Minivan",85),
  makeVehicle("Toyota","Fortuner","SUV",120),
  makeVehicle("Toyota","Starlet Cross","Crossover",55),
  makeVehicle("Toyota","Prius","Hybrid",65,"Hybrid"),
  makeVehicle("BYD","Seal","Sedan",95,"Electric"),
  makeVehicle("BYD","Atto 3","Electric",85,"Electric"),
  makeVehicle("BYD","Song Plus","SUV",85,"Hybrid"),
  makeVehicle("BYD","Dolphin","Hatchback",60,"Electric"),
  makeVehicle("BYD","Shark 6","Pickup",135,"Hybrid"),
  makeVehicle("BYD","Leopard 5","SUV",150,"Hybrid"),
  makeVehicle("BYD","Leopard 8","SUV",190,"Hybrid"),
  makeVehicle("BYD","Tang L","SUV",145,"Electric"),
  makeVehicle("BYD","Yuan Up","SUV",70,"Electric"),
  makeVehicle("BYD","Atto 2","SUV",75,"Electric"),
  makeVehicle("BYD","Sealion 7","SUV",110,"Electric"),
  makeVehicle("BYD","Atto 8","SUV",130,"Electric"),
  makeVehicle("Geely Riddara","RD6","Pickup",120,"Electric"),
  makeVehicle("Nissan","X-Trail","SUV",80),
  makeVehicle("Nissan","Terra","SUV",105),
  makeVehicle("Nissan","Navara","Pickup",110),
  makeVehicle("Suzuki","Swift","Hatchback",42),
  makeVehicle("Suzuki","Jimny","SUV",75),
  makeVehicle("Suzuki","Grand Vitara","SUV",78,"Hybrid"),
  makeVehicle("Hyundai","Tucson","SUV",80,"Hybrid"),
  makeVehicle("Hyundai","Santa Fe","SUV",110,"Hybrid"),
  makeVehicle("Kia","Sportage","SUV",78,"Hybrid"),
  makeVehicle("Kia","Sorento","SUV",105,"Hybrid"),
  makeVehicle("Volkswagen","Polo","Hatchback",50),
  makeVehicle("Volkswagen","Tiguan","SUV",85),
  makeVehicle("Volkswagen","Teramont","SUV",125),
  makeVehicle("Subaru","Forester","SUV",85),
  makeVehicle("Honda","Fit","Hatchback",45),
  makeVehicle("Changan","Hunter","Pickup",95),
  makeVehicle("Foton","Tunland V9","Pickup",125),
  makeVehicle("Leapmotor","C10","SUV",90,"Electric"),
  makeVehicle("Mercedes-Benz","GLE","SUV",180,"Petrol","https://images.openai.com/static-rsc-4/auyjHuwkhiStw2r4hORZ7Ko7TjX2DE-eNv7x7EM1nk5hu29e5cl2GzqAc7gTPr6G5YbmaWrT9iQAu5G9PMS-px6V_nD9sX2gRCy4exg-Ck4CXARn_x9MdoAG6xyA0ctJw08m93X3T36UthqVxcgxjAH22BVuTwPZ7nj4XV_dQxA?purpose=inline"),
  makeVehicle("Mercedes-Benz","G-Class","SUV",250,"Petrol","https://images.openai.com/static-rsc-4/JUsmDSbChmq68TGo5l7NQ2qvuabC_u50crohbz2crwAQJPXa7KlX7aiCCdNk5TVB27mJkJN5H__iiPXkhf35ZvQnXDU43zy7qX3fdShKkiwB7ttjSLPUK76rzajDYJOvded1DRHQG4odQISSNrDgSEMj_9PXKz2oPCrV59njhnM?purpose=inline"),
  makeVehicle("BMW","X5","SUV",160,"Petrol","https://images.openai.com/static-rsc-4/L_jcMVvMVg-wOre5yabsjPeAIDPQCZS4gUtfXd1pfeSXFH6PoCcearV1KrZ9PRq9sKIrFFJ6_6YsyqlBcYWGS5Fnlnl61WrwWuuewpx7-UDsth0ZdBaFUt8lPajhsGKLQdZkHPuybxuC_dl5podKTVbGB3eFxHsuv6NAnY68sEA?purpose=inline"),
  makeVehicle("BMW","X7","SUV",220,"Petrol","https://images.openai.com/static-rsc-4/F_GX0Tqc3b9jKZtfrBjAm4QEd_uhHR3OmOywOLcW0gmKlY68UpX_9LPpn1tWv7LI1LvYmTSvjyhwXUREmr6CXqqf_0Q8U9KTh9HtpcWtmuAiaklGGquYy3z8wCUhh3r9ZOOvNLPOmLhvhzNbYmmKSyJPwo1UfoOI1Se6ZikxQyU?purpose=inline"),
  makeVehicle("Land Rover","Range Rover Sport","SUV",220,"Petrol","https://images.openai.com/static-rsc-4/qq4F1G7K-q-TYDuC4AZa0t2RFW5hMTkoSNrLegRDme6i8-pl4xrTOutSkZlOTfLaCILxZVTT7sjZShhens2Zd7uuVmdq8OwT-LXkCfYdN_8hlfYbUDP_NMrsw99jHT2-964PY9G0neuymmNCy6nKtwQ8Z2444au537P2hX9gnOU?purpose=inline"),
  makeVehicle("Porsche","Cayenne","SUV",220,"Petrol","https://images.openai.com/static-rsc-4/oxfDm_tYfZy_OPJQOoI5DssxH7xNSGFlTutjwN1jjwDXBCd03XKFob3l4l-nOCzS_DTmCvs2VG5em-gWb_HhrmzgtWiv64ogUa3E6N8BgSXkP3ke29mKflehm0vuocnXFCk-f8O6-1HijQnkALWSq3mdNAuQNZ-be6eepKmiGRc?purpose=inline")
];

const $ = (selector, root = document) => root.querySelector(selector);
const grid = $("#cars-grid");
const searchInput = $("#search-input");
const typeFilter = $("#type-filter");
const sortSelect = $("#sort-select");
const pickupLocation = $("#pickup-location");
const pickupDate = $("#pickup-date");
const returnDate = $("#return-date");
let selectedVehicle = null;
let toastTimer;

function makeVehiclePlaceholder(label) {
  const safeLabel = label.replace(/[&<>"']/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&apos;"
  })[character]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><rect width="900" height="520" fill="#e8edf2"/><path d="M0 390h900v130H0z" fill="#d8e0e8"/><path d="m170 350 55-100c14-25 35-40 66-44l221-24c37-4 71 7 99 34l93 91 65 20c26 8 43 30 43 57v39H112v-31c0-24 17-45 41-52z" fill="#132741"/><path d="m282 247 228-24c24-3 43 4 62 21l65 63H233l43-48c2-3 4-7 6-12z" fill="#b8c8d8"/><circle cx="260" cy="420" r="52" fill="#26394f"/><circle cx="260" cy="420" r="25" fill="#eef1f4"/><circle cx="680" cy="420" r="52" fill="#26394f"/><circle cx="680" cy="420" r="25" fill="#eef1f4"/><text x="450" y="490" text-anchor="middle" fill="#526376" font-family="Arial,sans-serif" font-size="20">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

document.addEventListener("error", event => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.fallback) return;

  const vehicle = vehicles.find(car => car.id === image.dataset.vehicleImage);
  if (!image.dataset.fallbackAttempted) {
    image.dataset.fallbackAttempted = "true";
    image.src = image.dataset.fallback;
    if (vehicle) vehicle.image = image.dataset.fallback;
    return;
  }

  if (!image.dataset.placeholderAttempted) {
    image.dataset.placeholderAttempted = "true";
    image.src = makeVehiclePlaceholder(image.alt || "AutoX vehicle");
    if (vehicle) vehicle.image = image.src;
  }
}, true);

const heroVideo = $("#hero-video");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
function syncHeroVideoMotion() {
  if (motionPreference.matches) heroVideo.pause();
  else heroVideo.play().catch(() => {});
}
syncHeroVideoMotion();
motionPreference.addEventListener?.("change", syncHeroVideoMotion);

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = new Date();
const todayString = localDateString(today);
pickupDate.min = todayString;
returnDate.min = todayString;

function formatMoney(amount) {
  return `RWF ${new Intl.NumberFormat("en-RW", {maximumFractionDigits:0}).format(amount)}`;
}

function rentalRates(car) {
  return {
    day: car.dailyRate,
    week: car.dailyRate * 6,
    month: Math.round(car.dailyRate * 25.5)
  };
}

function estimateRentalTotal(car, days) {
  const rates = rentalRates(car);
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  const weeks = Math.floor(remainingDays / 7);
  const singleDays = remainingDays % 7;
  return months * rates.month + weeks * rates.week + singleDays * rates.day;
}

function rentalDays(start, end) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.ceil((endDate - startDate) / 86400000);
}

function renderCars() {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = vehicles.filter(car => {
    const matchesText = `${car.make} ${car.model} ${car.type}`.toLowerCase().includes(query);
    const matchesType = typeFilter.value === "all" || car.type === typeFilter.value;
    return matchesText && matchesType;
  });
  if (sortSelect.value === "price-low") filtered.sort((a,b) => a.dailyRate - b.dailyRate);
  if (sortSelect.value === "price-high") filtered.sort((a,b) => b.dailyRate - a.dailyRate);
  $("#inventory-count").textContent = filtered.length;
  $("#empty-state").hidden = filtered.length > 0;
  grid.innerHTML = filtered.map(car => `
    <article class="car">
      <div class="car-image-wrap"><button class="car-image-link" type="button" data-photo="${car.id}" aria-label="Expand photo of ${car.make} ${car.model}"><img src="${car.image}" data-vehicle-image="${car.id}" data-fallback="${car.fallbackImage}" alt="${car.alt}" loading="lazy"></button><span class="car-tag">${car.tag}</span><span class="availability-badge ${car.available ? "is-available" : "is-unavailable"}"><span class="availability-dot"></span>${car.available ? "Available" : "Not available"}</span></div>
      <div class="car-body">
        <div class="car-title-row"><h3>${car.make} ${car.model}</h3><span class="car-year">${car.type}</span></div>
        <p class="car-subtitle">${car.seats} seats · ${car.fuel} · ${car.transmission}</p>
        <div class="car-specs"><span>${car.seats} seats</span><span>${car.fuel}</span><span>${car.transmission}</span></div>
        <div class="rate-options" aria-label="Estimated rental rates">
          <div><strong>${formatMoney(rentalRates(car).day)}</strong><span>per day</span></div>
          <div><strong>${formatMoney(rentalRates(car).week)}</strong><span>per week</span></div>
          <div><strong>${formatMoney(rentalRates(car).month)}</strong><span>per month</span></div>
        </div>
        <p class="rate-note">Weekly covers 7 days; monthly covers 30 days.</p>
        <button class="details-button rental-card-cta" data-details="${car.id}">${car.available ? "VIEW &amp; BOOK" : "VIEW DETAILS"} &#8599;</button>
      </div>
    </article>`).join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
}

function updateReturnDateMinimum() {
  if (!pickupDate.value) return;
  const nextDay = new Date(`${pickupDate.value}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayString = localDateString(nextDay);
  returnDate.min = nextDayString;
  if (returnDate.value && returnDate.value < nextDayString) returnDate.value = nextDayString;
}

function updateBookingSummary() {
  const days = rentalDays(pickupDate.value, returnDate.value);
  const summary = $("#booking-summary");
  if (days > 0) {
    summary.textContent = `${days} rental day${days === 1 ? "" : "s"} · Pickup at ${pickupLocation.value}. Choose a car below to request it.`;
  } else {
    summary.textContent = "Choose your dates to see your trip estimate.";
  }
}

pickupDate.addEventListener("change", () => { updateReturnDateMinimum(); updateBookingSummary(); });
returnDate.addEventListener("change", updateBookingSummary);
pickupLocation.addEventListener("change", updateBookingSummary);

$("#booking-form").addEventListener("submit", event => {
  event.preventDefault();
  updateReturnDateMinimum();
  if (rentalDays(pickupDate.value, returnDate.value) < 1) {
    showToast("Please choose a return date after your pickup date.");
    return;
  }
  updateBookingSummary();
  $("#fleet").scrollIntoView({behavior:"smooth"});
});

function openVehicle(id) {
  const car = vehicles.find(item => item.id === id);
  if (!car) return;
  selectedVehicle = car;
  const earliestReturn = pickupDate.value ? new Date(`${pickupDate.value}T00:00:00`) : new Date();
  earliestReturn.setDate(earliestReturn.getDate() + 1);
  const days = rentalDays(pickupDate.value, returnDate.value);
  const rates = rentalRates(car);
  const estimate = days > 0 ? `<div class="rental-total"><span>${days}-day estimate using available day, week, and month packages</span><strong>Estimated total: ${formatMoney(estimateRentalTotal(car, days))}</strong></div>` : `<div class="rental-total"><span>Choose dates to see a trip estimate</span><strong>From ${formatMoney(rates.day)} per day</strong></div>`;
  const locations = ["Kigali City Centre","Kigali International Airport","Kigali Convention Centre"];
  const pickupOptions = locations.map(location => `<option value="${location}" ${pickupLocation.value === location ? "selected" : ""}>${location}</option>`).join("");
  const returnOptions = locations.map(location => `<option value="${location}" ${pickupLocation.value === location ? "selected" : ""}>${location}</option>`).join("");
  const passengerOptions = Array.from({length:car.seats}, (_, index) => `<option value="${index + 1}">${index + 1} passenger${index === 0 ? "" : "s"}</option>`).join("");
  const requestMarkup = car.available ? `
      <form class="rental-request-form" id="rental-request-form">
        <h3 class="form-section-title">Your contact details</h3>
        <div class="renter-fields">
          <label for="renter-name">Full name<input id="renter-name" name="full-name" autocomplete="name" placeholder="Name for the booking" required></label>
          <label for="renter-email">Email address<input id="renter-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
          <label for="renter-phone">Phone or WhatsApp<input id="renter-phone" name="phone" type="tel" autocomplete="tel" placeholder="+250..." required></label>
        </div>
        <h3 class="form-section-title">Your trip details</h3>
        <div class="request-dates">
          <label for="request-pickup">Pickup date<input id="request-pickup" name="pickup" type="date" min="${todayString}" value="${pickupDate.value}" required></label>
          <label for="request-pickup-time">Pickup time<input id="request-pickup-time" name="pickup-time" type="time" value="09:00" required></label>
          <label for="request-return">Return date<input id="request-return" name="return" type="date" min="${localDateString(earliestReturn)}" value="${returnDate.value}" required></label>
          <label for="request-return-time">Return time<input id="request-return-time" name="return-time" type="time" value="09:00" required></label>
        </div>
        <div class="renter-fields trip-fields">
          <label for="request-pickup-location">Pickup location<select id="request-pickup-location" name="pickup-location">${pickupOptions}</select></label>
          <label for="request-return-location">Return location<select id="request-return-location" name="return-location">${returnOptions}</select></label>
          <label for="request-passengers">Number of passengers<select id="request-passengers" name="passengers">${passengerOptions}</select></label>
        </div>
        <label class="notes-field" for="renter-notes">Special requests or trip details<textarea id="renter-notes" name="notes" rows="3" placeholder="Share any questions, luggage needs, or pickup instructions."></textarea></label>
        <p class="request-note">This prepares an email enquiry. Your rental is confirmed only after our team checks availability and replies. Please do not include payment details here.</p>
        <button class="btn btn-full" type="submit">Send rental request <span>&#8594;</span></button>
      </form>` : `<div class="availability-message">This car is currently marked as unavailable. Please choose another vehicle or contact our team to check again later.</div>`;
  $("#dialog-content").innerHTML = `
    <img class="dialog-image" src="${car.image}" data-vehicle-image="${car.id}" data-fallback="${car.fallbackImage}" alt="${car.alt}">
    <div class="dialog-body">
      <span class="eyebrow">${car.type} · ${car.seats} seats</span>
      <h2 id="dialog-title">${car.make} ${car.model}</h2>
      <span class="availability-badge detail-availability ${car.available ? "is-available" : "is-unavailable"}"><span class="availability-dot"></span>${car.available ? "Available" : "Not available"}</span>
      <section class="vehicle-specifications" aria-labelledby="specification-title"><h3 id="specification-title">Vehicle specifications</h3><dl><div><dt>Model</dt><dd>${car.make} ${car.model}</dd></div><div><dt>Vehicle type</dt><dd>${car.type}</dd></div><div><dt>Passenger capacity</dt><dd>Up to ${car.seats} people</dd></div><div><dt>Fuel</dt><dd>${car.fuel}</dd></div><div><dt>Transmission</dt><dd>${car.transmission}</dd></div></dl><p>Exact vehicle trim and equipment are confirmed by our team before booking.</p></section>
      <div class="dialog-price">Rental rates</div>
      <div class="rate-options dialog-rates"><div><strong>${formatMoney(rates.day)}</strong><span>per day</span></div><div><strong>${formatMoney(rates.week)}</strong><span>per week</span></div><div><strong>${formatMoney(rates.month)}</strong><span>per month</span></div></div>
      <p>${car.description}</p>
      ${estimate}
      ${requestMarkup}
    </div>`;
  $("#vehicle-dialog").showModal();
}

grid.addEventListener("click", event => {
  const photo = event.target.closest("[data-photo]");
  if (photo) {
    const car = vehicles.find(item => item.id === photo.dataset.photo);
    if (car) {
      const image = $("#photo-dialog-image");
      image.src = car.image;
      image.dataset.vehicleImage = car.id;
      image.dataset.fallback = car.fallbackImage;
      delete image.dataset.fallbackAttempted;
      delete image.dataset.placeholderAttempted;
      image.alt = car.alt;
      $("#photo-dialog").showModal();
    }
    return;
  }
  const details = event.target.closest("[data-details]");
  if (details) openVehicle(details.dataset.details);
});

function updateRentalEstimate() {
  if (!selectedVehicle) return;
  const start = $("#request-pickup").value;
  const end = $("#request-return").value;
  const days = rentalDays(start, end);
  const total = days > 0
    ? `<span>${days}-day estimate using day, week, and month packages</span><strong>Estimated total: ${formatMoney(estimateRentalTotal(selectedVehicle, days))}</strong>`
    : `<span>Choose dates to see a trip estimate</span><strong>From ${formatMoney(rentalRates(selectedVehicle).day)} per day</strong>`;
  $(".rental-total").innerHTML = total;
}

$("#dialog-content").addEventListener("change", event => {
  if (event.target.id === "request-pickup") {
    const nextDay = new Date(`${event.target.value}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    const returnInput = $("#request-return");
    returnInput.min = localDateString(nextDay);
    if (returnInput.value && returnInput.value < returnInput.min) returnInput.value = returnInput.min;
  }
  if (event.target.id === "request-pickup" || event.target.id === "request-return") updateRentalEstimate();
});

$("#dialog-content").addEventListener("submit", event => {
  if (event.target.id !== "rental-request-form") return;
  event.preventDefault();
  const form = event.target;
  const pickupValue = form.elements.namedItem("pickup").value;
  const returnValue = form.elements.namedItem("return").value;
  if (rentalDays(pickupValue, returnValue) < 1) {
    showToast("Return date must be after pickup date.");
    return;
  }
  const days = rentalDays(pickupValue, returnValue);
  const subject = `AutoX rental request - ${selectedVehicle.make} ${selectedVehicle.model}`;
  const body = [
    `Car: ${selectedVehicle.make} ${selectedVehicle.model}`,
    `Estimated daily rate: ${formatMoney(rentalRates(selectedVehicle).day)}`,
    `Estimated weekly package: ${formatMoney(rentalRates(selectedVehicle).week)}`,
    `Estimated monthly package: ${formatMoney(rentalRates(selectedVehicle).month)}`,
    `Estimated rental total: ${formatMoney(estimateRentalTotal(selectedVehicle, days))} for ${days} days`,
    `Pickup: ${pickupValue} at ${form.elements["pickup-time"].value}`,
    `Return: ${returnValue} at ${form.elements["return-time"].value}`,
    `Pickup location: ${form.elements["pickup-location"].value}`,
    `Return location: ${form.elements["return-location"].value}`,
    `Passengers: ${form.elements.passengers.value}`,
    `Name: ${form.elements["full-name"].value}`,
    `Email: ${form.elements.email.value}`,
    `Phone: ${form.elements.phone.value}`,
    `Special requests: ${form.elements.notes.value || "None"}`,
    "Please confirm availability and the final rental terms."
  ].join("\n");
  window.location.href = `mailto:hello@autox.example?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

$("#vehicle-dialog").addEventListener("click", event => {
  if (event.target === event.currentTarget || event.target.closest("[data-close-dialog]")) event.currentTarget.close();
});
$("#photo-dialog").addEventListener("click", event => {
  if (event.target === event.currentTarget || event.target.closest("[data-close-photo]")) event.currentTarget.close();
});

searchInput.addEventListener("input", renderCars);
typeFilter.addEventListener("change", renderCars);
sortSelect.addEventListener("change", renderCars);

const menuToggle = $("#menu-toggle");
const navigation = $("#navigation");
function closeMenu() {
  navigation.classList.remove("show");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  menuToggle.innerHTML = "&#9776;";
}
menuToggle.addEventListener("click", () => {
  const open = navigation.classList.toggle("show");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  menuToggle.textContent = open ? "×" : "☰";
});
navigation.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });

$("#current-year").textContent = new Date().getFullYear();
renderCars();
updateBookingSummary();
