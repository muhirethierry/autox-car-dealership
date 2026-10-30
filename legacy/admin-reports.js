(() => {
  const monthKeys = count => {
    const now = new Date();
    return Array.from({length:count}, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
      return {key:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`, label:date.toLocaleDateString("en-GB", {month:"short"})};
    });
  };

  const safeText = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[character]);
  const money = value => `RWF ${Number(value || 0).toLocaleString("en-US")}`;

  function svgBarChart(container, rows, valueKey, color = "#e5b421", asMoney = false) {
    if (!container) return;
    if (!rows.length) { container.innerHTML = `<div class="chart-empty">No data for this period.</div>`; return; }
    const width = 620, height = 210, left = 46, right = 12, top = 18, bottom = 32;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const maximum = Math.max(1, ...rows.map(row => Number(row[valueKey]) || 0));
    const points = rows.map((row, index) => {
      const x = left + plotWidth * (index + .5) / rows.length;
      const y = top + plotHeight - ((Number(row[valueKey]) || 0) / maximum) * plotHeight;
      return {x, y, row};
    });
    const bars = points.map((point, index) => {
      const band = plotWidth / rows.length;
      const barWidth = Math.max(8, Math.min(38, band * .48));
      const barHeight = Math.max(2, top + plotHeight - point.y);
      return `<rect x="${(point.x - barWidth/2).toFixed(1)}" y="${point.y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="4" fill="${color}" opacity="${index === rows.length-1 ? 1 : .7}"><title>${safeText(point.row.label)}: ${asMoney ? money(point.row[valueKey]) : point.row[valueKey]}</title></rect><text x="${point.x.toFixed(1)}" y="${height-8}" text-anchor="middle">${safeText(point.row.label)}</text>`;
    }).join("");
    const guides = [0,.33,.66,1].map(ratio => {
      const y = top + plotHeight * ratio;
      const value = Math.round(maximum * (1-ratio));
      const label = asMoney ? (value >= 1000000 ? `${(value/1000000).toFixed(1)}m` : value >= 1000 ? `${Math.round(value/1000)}k` : value) : value;
      return `<line x1="${left}" y1="${y}" x2="${width-right}" y2="${y}"/><text x="${left-8}" y="${y+3}" text-anchor="end">${label}</text>`;
    }).join("");
    container.innerHTML = `<svg class="report-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${asMoney ? "Verified revenue" : "Rental request count"} for the selected months">${guides}${bars}</svg>`;
  }

  function render({fleet, requests, payments, range = 6}) {
    const months = monthKeys(Number(range) || 6);
    const values = months.map(month => ({...month, count:0, revenue:0, customers:0}));
    const byMonth = new Map(values.map(item => [item.key, item]));
    for (const request of requests) {
      const dateValue = request.createdAt || request.pickup;
      if (!dateValue) continue;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) continue;
      const bucket = byMonth.get(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`);
      if (bucket) bucket.count += 1;
    }
    for (const payment of payments) {
      if (payment.verificationStatus !== "Verified" || payment.verified !== true) continue;
      const date = new Date(payment.paidAt || payment.date || payment.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const month = byMonth.get(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`);
      if (month) month.revenue += Number(payment.amount) || 0;
    }
    const verifiedPayments = payments.filter(payment => payment.verificationStatus === "Verified" && payment.verified === true);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const weekStart = new Date(now.getFullYear(),now.getMonth(),now.getDate()-6);
    const monthStart = `${today.slice(0,7)}-01`;
    const within = (value,start,end) => {
      const date = new Date(value || "");
      if (Number.isNaN(date.getTime())) return false;
      const local = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      return local >= start && local <= end;
    };
    const verifiedTotal = (start,end) => verifiedPayments.filter(payment => within(payment.paidAt || payment.date || payment.createdAt,start,end)).reduce((sum,payment) => sum + (Number(payment.amount) || 0),0);
    const weekStartString = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;
    document.querySelector("#report-daily-revenue").textContent = money(verifiedTotal(today,today));
    document.querySelector("#report-weekly-revenue").textContent = money(verifiedTotal(weekStartString,today));
    document.querySelector("#report-monthly-revenue").textContent = money(verifiedTotal(monthStart,today));

    const customersByEmail = new Map();
    for (const request of requests) {
      const email = String(request.email || "").toLowerCase();
      const date = request.createdAt || request.pickup;
      if (!email || !date) continue;
      const existing = customersByEmail.get(email);
      if (!existing || new Date(date) < new Date(existing)) customersByEmail.set(email,date);
    }
    for (const dateValue of customersByEmail.values()) {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) continue;
      const month = byMonth.get(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`);
      if (month) month.customers += 1;
    }
    svgBarChart(document.querySelector("#overview-revenue-chart"), values, "revenue", "#e5b421", true);
    svgBarChart(document.querySelector("#overview-rentals-chart"), values, "count", "#7189ad");
    svgBarChart(document.querySelector("#report-revenue-chart"), values, "revenue", "#e5b421", true);
    svgBarChart(document.querySelector("#report-booking-chart"), values, "count", "#7189ad");
    svgBarChart(document.querySelector("#report-customer-chart"), values, "customers", "#319873");

    const activeIds = new Set(requests.filter(request => request.status === "Active").map(request => request.carId));
    const active = fleet.filter(car => activeIds.has(car.id)).length;
    const maintenanceCount = fleet.filter(car => car.maintenanceStatus && !activeIds.has(car.id)).length;
    const available = fleet.filter(car => car.available).length;
    const unavailable = Math.max(0,fleet.length - available - active - maintenanceCount);
    const sum = fleet.length || 1;
    const slices = [available, active, maintenanceCount, unavailable].map(value => value / sum * 100);
    const starts = [0, slices[0], slices[0]+slices[1], slices[0]+slices[1]+slices[2]];
    const colors = ["#319873", "#6f88b3", "#e1ad27", "#dfe4eb"];
    const stops = colors.map((color, index) => `${color} ${starts[index]}% ${starts[index]+slices[index]}%`).join(",");
    const chart = document.querySelector("#availability-chart");
    if (chart) chart.innerHTML = `<div class="availability-donut" style="background:conic-gradient(${stops})"><span><strong>${fleet.length}</strong><small>vehicles</small></span></div><div class="availability-legend"><span><i style="--legend-color:#319873"></i>Available <b>${available}</b></span><span><i style="--legend-color:#6f88b3"></i>Rented <b>${active}</b></span><span><i style="--legend-color:#e1ad27"></i>Maintenance <b>${maintenanceCount}</b></span><span><i style="--legend-color:#dfe4eb"></i>Unavailable <b>${unavailable}</b></span></div>`;

    const counts = requests.reduce((result, request) => {
      const name = request.carName || "Vehicle";
      result[name] = (result[name] || 0) + 1;
      return result;
    }, {});
    const popular = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,6);
    const popularNode = document.querySelector("#popular-vehicles-list");
    if (popularNode) popularNode.innerHTML = popular.map(([name,count], index) => `<div class="report-rank-row"><span>${String(index+1).padStart(2,"0")}</span><strong>${safeText(name)}</strong><small>${count} request${count === 1 ? "" : "s"}</small></div>`).join("") || `<div class="inline-empty">Vehicle request trends appear after rental requests are received.</div>`;

    const completed = requests.filter(request => request.status === "Completed").length;
    const cancelled = requests.filter(request => ["Cancelled","Rejected"].includes(request.status)).length;
    const utilization = fleet.length ? Math.round(active / fleet.length * 100) : 0;
    const ops = document.querySelector("#operations-summary");
    if (ops) ops.innerHTML = [["Fleet utilization",`${utilization}%`],["Completed rentals",completed],["Cancelled / rejected",cancelled],["Rental requests",requests.length]].map(([label,value]) => `<div class="operations-stat"><span>${label}</span><strong>${value}</strong></div>`).join("");
  }

  function csvCell(value) {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function exportCSV(requests, payments, fleet) {
    const rows = [["Record type","Reference","Customer / vehicle","Status","Amount RWF","Date","Verification"]];
    for (const request of requests) rows.push(["Rental request",request.reference,`${request.name || ""} / ${request.carName || ""}`,request.status,request.estimatedTotal || "",request.createdAt || request.pickup,"Estimate only"]);
    for (const payment of payments) rows.push(["Payment",payment.reference,`${payment.customerName || ""} / ${payment.vehicleName || ""}`,payment.status,payment.amount,payment.date || payment.paidAt,payment.verificationStatus || "Unverified"]);
    for (const car of fleet) rows.push(["Fleet",car.id,`${car.make} ${car.model}`,car.available ? "Available" : car.maintenanceStatus || "Unavailable",car.dailyRate,"","Not applicable"]);
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff",csv], {type:"text/csv;charset=utf-8"}));
    link.download = `autox-report-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  window.AutoXReports = {render, exportCSV};
})();
