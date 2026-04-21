// ==========================================
// 1. KHỞI TẠO BIẾN TOÀN CỤC
// ==========================================
let excelData = { breakfasts: [], lunches: [], dinners: [], places: [], services: [], activities: [] };
let userSelectedImages = []; 
let currentPreviewBlobs = []; 
// Mảng chủ đề font chữ cho các bộ ảnh
let foodImages = []; // Biến mới để giữ ảnh đồ ăn
const menuThemes = [
    { name: 'Trending TikTok', font: "'Anton', sans-serif" },
    { name: 'Thanh lịch', font: "'Be Vietnam Pro', sans-serif" },
    { name: 'Sang trọng', font: "'Playfair Display', serif" },
    { name: 'Hiện đại - TikTok', font: "'Montserrat', sans-serif" },
    { name: 'Thủ công - Nhật ký', font: "'Dancing Script', cursive" }
];

// Mảng màu tiêu đề ngẫu nhiên (có thể mở rộng thêm)
const titleColors = [
    '#FFD700', // Vàng Gold truyền thống
    '#FFEA00', // Vàng Chanh rực rỡ
    '#00FFCC', // Xanh Ngọc Teal
    '#00FF7F', // Xanh Lá chuối (Neon)
    '#00E5FF', // Xanh Electric Blue
    '#70D6FF', // Xanh Sky Pastel
    '#FF70A6', // Hồng đậm Trendy
    '#FF9770', // Cam San hô
    '#FFD670', // Vàng Kem
    '#E9FF70', // Xanh Bơ
    '#FF6767', // Đỏ San hô (không chói)
    '#A594F4', // Tím Lavender
    '#83C5BE', // Xanh Bạc hà trầm
    '#E29578', // Cam Đất (Vintage)
    '#FFBC42', // Cam Vàng
    '#D81159', // Đỏ Ruby
    '#FBFF12'  // Vàng Neon
];
// ==========================================
// 2. XỬ LÝ NẠP DỮ LIỆU TỪ EXCEL
// ==========================================
document.getElementById('input-excel').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Reset dữ liệu và khởi tạo đủ các mảng
            excelData = { breakfasts: [], lunches: [], dinners: [], places: [], services: [], activities: [] };

            workbook.SheetNames.forEach(sheetName => {
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if (sheet.length === 0) return;

    sheet.forEach(row => {
        // Lấy tên: Ưu tiên cột "Hoat_dong" cho sheet hoạt động, các sheet khác lấy "Ten_quan" hoặc "Tên địa điểm"
        let name = row['Hoat_dong'] || row['Ten_quan'] || row['Tên quán'] || row['TÊN ĐỊA ĐIỂM'] || row['Tên homestay'];
        let address = row['Dia_chi'] || row['Địa chỉ'] || "";
        let isPartner = row['Doi_tac']?.toString().toLowerCase() === 'x' || row['Đối tác']?.toString().toLowerCase() === 'x';

        if (!name) return;

        // Làm sạch dữ liệu: Xóa mọi dấu 👉 có sẵn trong file Excel để tránh bị nhân đôi
        const cleanName = name.toString().replace(/👉/g, '').trim();
        
        const item = { 
            name: cleanName + (address ? ` - ${address.toString().trim()}` : ""), 
            isPartner: isPartner 
        };

        // Phân loại chính xác dựa trên tên Sheet thực tế trong file của bạn
        const sn = sheetName.toLowerCase();
        if (sn.includes('quan_an')) {
            const model = (row['Mo_hinh'] || "").toString();
            if (model.includes('Sáng')) excelData.breakfasts.push(item);
            else if (model.includes('Trưa')) excelData.lunches.push(item);
            else if (model.includes('Tối')) excelData.dinners.push(item);
            else excelData.breakfasts.push(item);
        } else if (sn.includes('hoat_dong')) {
            excelData.activities.push(item); // Đã khớp với cột Hoat_dong
        } else if (sn.includes('dich_vu')) {
            excelData.services.push(item);
        } else {
            excelData.places.push(item);
        }
    });
});

            const status = document.getElementById('excel-status');
            status.innerText = `✅ Đã nạp: ${excelData.services.length} dịch vụ, ${excelData.activities.length} hoạt động.`;
            status.style.color = "#66ff66";
        } catch (err) { 
            alert("❌ Lỗi đọc file Excel!"); 
        }
    };
    reader.readAsArrayBuffer(file);
});

// Xử lý nạp thư mục ảnh
document.getElementById('input-bg-folder').addEventListener('change', function(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return alert("Thư mục không có ảnh!");
    userSelectedImages = files.map(file => URL.createObjectURL(file));
    document.getElementById('folder-status').innerText = `✅ Đã nạp ${userSelectedImages.length} ảnh nền`;
});
// Xử lý nạp thư mục ảnh đồ ăn
document.getElementById('input-food-folder').addEventListener('change', function(e) {
    const files = e.target.files;
    const status = document.getElementById('food-status');
    foodImages = []; // Xóa cũ nạp mới

    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            foodImages.push({ url: url, name: file.name });
        }
    }

    if (foodImages.length > 0) {
        status.innerText = `Đã nạp ${foodImages.length} ảnh đồ ăn.`;
        status.style.color = "#00ff00";
    }
});
// ==========================================
// 3. QUẢN LÝ BỘ ẢNH (SETS) & RENDER
// ==========================================
async function generateAndPreview() {
    if (userSelectedImages.length === 0) return alert("Vui lòng chọn Folder ảnh nền!");
    if (excelData.breakfasts.length === 0 && excelData.places.length === 0) return alert("Vui lòng nạp file Excel!");

    let quantity = parseInt(document.getElementById('set-count').value) || 1;
    const container = document.getElementById('preview-content');
    container.innerHTML = ''; 
    currentPreviewBlobs = []; 

    for (let i = 1; i <= quantity; i++) {
        await createSetRow(i);
    }
}

async function createSetRow(index) {
    const container = document.getElementById('preview-content');
    const row = document.createElement('div');
    row.className = 'preview-set-row';
    row.id = `set-row-${index}`;
    
    row.innerHTML = `
        <div class="set-toolbar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom: 1px solid #2d3446; padding-bottom: 15px;">
            <div class="set-info">
                <span style="color:#ffaa00; font-size: 1.2rem; font-weight:bold;">📦 BỘ ẢNH SỐ ${index}</span>
            </div>
            <div class="set-btns">
                <button onclick="refreshSet(${index})" class="btn-refresh" style="background:#2d3446; color:white; border:1px solid #3d4459; padding:8px 15px; border-radius:8px; cursor:pointer;">🔄 Đổi nội dung</button>
                <button onclick="removeSet(${index})" class="btn-remove" style="background:rgba(238, 29, 82, 0.1); color:#ee1d52; border:1px solid #ee1d52; padding:8px 15px; border-radius:8px; cursor:pointer; margin-left:10px;">🗑️ Xóa</button>
            </div>
        </div>
        <div class="set-images-container" id="set-images-${index}"></div>`;
        
    container.appendChild(row);
    await renderSetImages(index);
}

async function renderSetImages(index) {
    const imgContainer = document.getElementById(`set-images-${index}`);
    const setTheme = menuThemes[Math.floor(Math.random() * menuThemes.length)];
    const setHeaderColor = titleColors[Math.floor(Math.random() * titleColors.length)];
    
    const pageIds = ['tiktok-cover', 'tiktok-day1-page', 'tiktok-day2-page', 'tiktok-day3-page', 'tiktok-service-page', 'tiktok-activity-page'];
    
    // Tạo bản sao danh sách ảnh nền và trộn ngẫu nhiên để lấy dần (tránh trùng lặp)
    let availableBgs = [...userSelectedImages].sort(() => Math.random() - 0.5);

    imgContainer.innerHTML = '<p style="color: #ffaa00;">✨ Đang vẽ bộ ảnh độc bản (không trùng lặp)...</p>'; 
    let usedItems = new Set(); 

    // Hàm lấy 3 ảnh đồ ăn ngẫu nhiên
    function getRandomFoodThumbs(count) {
        const source = (typeof foodImages !== 'undefined' && foodImages.length > 0) ? foodImages : availableBgs;
        if (source.length === 0) return [];
        return [...source].sort(() => Math.random() - 0.5).slice(0, count);
    }

    for (let j = 0; j < pageIds.length; j++) { 
        const el = document.getElementById(pageIds[j]);
        if (!el) continue;

        // 1. GÁN ẢNH NỀN (Lấy 1 tấm và loại bỏ khỏi danh sách availableBgs)
        if (availableBgs.length > 0) {
            let bgImg = availableBgs.shift(); // Lấy tấm đầu tiên và xóa khỏi mảng
            let bgUrl = typeof bgImg === 'object' ? bgImg.url : bgImg;
            el.style.backgroundImage = `url('${bgUrl}')`;
        }

        // 2. ĐỔ DỮ LIỆU CHỮ (Dịch vụ, Hoạt động, Lịch trình)
        if (pageIds[j] === 'tiktok-service-page') {
            const listEl = el.querySelector('#service-list');
            const items = getUniquePriority(excelData.services, 5, new Set()); 
            listEl.innerHTML = items.map(text => `<li style="list-style:none;">👉 ${text}</li>`).join('');
        } 
        else if (pageIds[j] === 'tiktok-activity-page') {
            const listEl = el.querySelector('#activity-list');
            const items = getUniquePriority(excelData.activities, 5, new Set());
            listEl.innerHTML = items.map(text => `<li style="list-style:none;">👉 ${text}</li>`).join('');
        }
        else if (j >= 1 && j <= 3) {
            const foodList = el.querySelector(`#food-list-day${j}`);
            const playList = el.querySelector(`#play-list-day${j}`);
            const foodImagesBox = el.querySelector(`#food-images-day${j}`);
            const playImagesBox = el.querySelector(`#play-images-day${j}`); // Thẻ chứa 2 ảnh đi chơi

            // Đổ text món ăn & địa điểm
            const morning = getUniquePriority(excelData.breakfasts, 1, usedItems)[0];
            const lunch = getUniquePriority(excelData.lunches, 1, usedItems)[0];
            const dinner = getUniquePriority(excelData.dinners, 1, usedItems)[0];
            const sites = getUniquePriority(excelData.places, 6, usedItems);

            if (foodList) foodList.innerHTML = `<li>Sáng: ${morning}</li><li>Trưa: ${lunch}</li><li>Tối: ${dinner}</li>`;
            if (playList) playList.innerHTML = sites.map(s => `<li>👉 ${s}</li>`).join('');
            
            // CHÈN 3 ẢNH ĐỒ ĂN
            if (foodImagesBox) {
                const thumbs = getRandomFoodThumbs(3);
                foodImagesBox.innerHTML = thumbs.map(img => {
                    const url = typeof img === 'object' ? img.url : img;
                    return `<img src="${url}" class="mini-thumb">`;
                }).join('');
            }

            // CHÈN 2 ẢNH ĐI CHƠI (Lấy từ ảnh nền còn lại và loại bỏ để không trùng nền trang sau)
            if (playImagesBox) {
                let playPhotos = [];
                for(let i=0; i<4; i++) {
                    if(availableBgs.length > 0) playPhotos.push(availableBgs.shift());
                }
                playImagesBox.innerHTML = playPhotos.map(img => {
                    const url = typeof img === 'object' ? img.url : img;
                    return `<img src="${url}" class="mini-thumb">`;
                }).join('');
            }
        }

        // 3. ĐỊNH DẠNG & VẼ CANVAS
        el.style.fontFamily = setTheme.font;
        el.querySelectorAll('.section-title').forEach(t => t.style.color = setHeaderColor);

        const canvas = await html2canvas(el, { width: 900, height: 1180, scale: 2, useCORS: true });
        const imgUrl = canvas.toDataURL("image/jpeg", 0.9);
        if (j === 0) imgContainer.innerHTML = ''; 

        const imgItem = document.createElement('div');
        imgItem.className = 'preview-item';
        imgItem.innerHTML = `<img src="${imgUrl}" style="width:100%; border-radius:12px; border:1px solid #333;">`;
        imgContainer.appendChild(imgItem);

        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
        currentPreviewBlobs.push({ setId: index, name: `Bo_${index}/Trang_${j + 1}.jpg`, blob: blob });
    }
}
function getUniquePriority(pool, count, usedSet) {
    if (!pool || pool.length === 0) return Array(count).fill("Đang cập nhật...");
    let available = pool.filter(item => !usedSet.has(item.name));
    if (available.length < count) available = pool; 
    let selected = available.sort(() => Math.random() - 0.5).slice(0, count);
    return selected.map(item => {
        usedSet.add(item.name);
        return item.name;
    });
}

// Các hàm phụ trợ khác (Giữ nguyên Zip, Remove, Refresh của bạn)
async function downloadZipFromPreview() {
    if (currentPreviewBlobs.length === 0) return alert("Không có ảnh!");
    const zip = new JSZip();
    currentPreviewBlobs.forEach(item => zip.file(item.name, item.blob));
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `Dalat_Export.zip`;
    link.click();
}

function removeSet(index) {
    document.getElementById(`set-row-${index}`).remove();
    currentPreviewBlobs = currentPreviewBlobs.filter(item => item.setId !== index);
}

async function refreshSet(index) {
    currentPreviewBlobs = currentPreviewBlobs.filter(item => item.setId !== index);
    await renderSetImages(index);
}

//AI Cover Title Generation
async function generateAICoverTitle(topic, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Câu lệnh yêu cầu AI viết tiêu đề TikTok
    const prompt = `Hãy viết một tiêu đề ngắn gọn, cực kỳ thu hút (viral) cho video TikTok về chủ đề du lịch: "${topic}". 
    Yêu cầu: Chỉ trả về duy nhất dòng tiêu đề, không thêm dấu ngoặc kép, không giải thích gì thêm, độ dài dưới 10 từ, kèm theo 1-2 emoji phù hợp.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Lỗi AI:", error);
        return "Lịch Trình Du Lịch Đà Lạt"; // Tiêu đề dự phòng nếu lỗi
    }
}
// Hàm gọi AI chính
// Hàm này sẽ được gọi khi bấm nút "AI VIẾT TIÊU ĐỀ BÌA"
// --- HÀM LƯU API KEY (Sửa lỗi saveApiKeys is not defined) ---
function saveApiKeys() {
    const inputs = document.querySelectorAll('input');
    let gKey = "", dKey = "";
    
    inputs.forEach(input => {
        if (input.placeholder.toLowerCase().includes("gemini")) gKey = input.value;
        if (input.placeholder.toLowerCase().includes("deepseek")) dKey = input.value;
    });

    localStorage.setItem('gemini_key', gKey);
    localStorage.setItem('deepseek_key', dKey);
    alert("Đã lưu API Key thành công!");
}

// --- HÀM TẠO TIÊU ĐỀ AI (Sửa lỗi TypeError: Cannot read properties of null) ---
async function generateAICoverTitle() {
    // 1. Tìm các ô nhập liệu một cách thông minh
    const inputs = document.querySelectorAll('input');
    const textareas = document.querySelectorAll('textarea');
    
    let geminiKey = "";
    let deepseekKey = "";
    let userPrompt = "";

    // Tìm Key trong các ô input dựa trên placeholder
    inputs.forEach(input => {
        const p = input.placeholder.toLowerCase();
        if (p.includes("gemini")) geminiKey = input.value.trim();
        if (p.includes("deepseek")) deepseekKey = input.value.trim();
    });

    // Tìm ý tưởng trong ô textarea
    textareas.forEach(area => {
        userPrompt = area.value.trim();
    });

    if (!userPrompt) {
        alert("Bạn chưa nhập nội dung ý tưởng vào ô văn bản!");
        return;
    }

    // 2. Tìm thẻ tiêu đề trên trang bìa
    const mainTitleElement = document.querySelector('#tiktok-cover-page .main-title');
    if (!mainTitleElement) {
        alert("Không tìm thấy thẻ tiêu đề trên ảnh bìa!");
        return;
    }

    const originalText = mainTitleElement.innerText;
    mainTitleElement.innerText = "⏳ AI đang viết tiêu đề...";

    const prompt = `Bạn là chuyên gia viral TikTok. Hãy viết 1 tiêu đề ngắn (dưới 10 từ) cho ảnh bìa du lịch từ ý tưởng: "${userPrompt}". Yêu cầu: Thu hút, kèm emoji, chỉ trả về text tiêu đề, không để dấu ngoặc kép.`;

    try {
        let aiResult = "";
        
        // Ưu tiên DeepSeek nếu có nhập key
        if (deepseekKey && deepseekKey.length > 10) {
            const response = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${deepseekKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const data = await response.json();
            aiResult = data.choices[0].message.content.trim();
        } 
        // Nếu không có DeepSeek thì dùng Gemini
        else if (geminiKey && geminiKey.length > 10) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            aiResult = data.candidates[0].content.parts[0].text.trim();
        } else {
            alert("Vui lòng nhập API Key hợp lệ!");
            mainTitleElement.innerText = originalText;
            return;
        }

        if (aiResult) {
            mainTitleElement.innerText = aiResult;
            mainTitleElement.style.color = titleColors[Math.floor(Math.random() * titleColors.length)];
        }

    } catch (error) {
        console.error("Lỗi:", error);
        alert("Lỗi kết nối AI. Hãy kiểm tra lại Key!");
        mainTitleElement.innerText = originalText;
    }
}

// Gán hàm vào hàm generateAISet nếu bạn dùng nút đó
async function generateAISet() {
    await generateAICoverTitle();
}

// Hàm gọi Gemini
async function callGeminiAPI(prompt, key) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

// Hàm gọi DeepSeek
async function callDeepSeekAPI(prompt, key) {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }]
        })
    });
    const data = await response.json();
    return data.choices[0].message.content.trim();
}
async function getAiCoverTitle() {
    const apiKey = document.querySelector('input[placeholder="Nhập API Key Gemini..."]').value;
    const userContent = document.querySelector('textarea[placeholder="Nhập nội dung bạn muốn tạo bộ ảnh..."]').value;

    if (!apiKey || !userContent) {
        alert("Vui lòng nhập API Key và Nội dung ý tưởng!");
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const prompt = `Bạn là chuyên gia viral TikTok. Hãy viết 1 tiêu đề ngắn (dưới 10 từ) cho ảnh bìa du lịch dựa trên ý tưởng: "${userContent}". 
    Yêu cầu: Viết cực kỳ thu hút, kèm 1-2 emoji, chỉ trả về text tiêu đề, không để dấu ngoặc kép.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Lỗi AI:", error);
        alert("Không thể kết nối AI. Kiểm tra lại mã API!");
        return null;
    }
}
async function generateAISet() {
    // 1. Gọi AI lấy tiêu đề mới
    const newTitle = await getAiCoverTitle();
    
    if (newTitle) {
        // 2. Cập nhật tiêu đề vào trang bìa đang hiển thị trên màn hình
        const mainTitleElement = document.querySelector('#tiktok-cover-page .main-title');
        if (mainTitleElement) {
            mainTitleElement.innerText = newTitle;
            // Đổi màu ngẫu nhiên cho tiêu đề AI thêm rực rỡ
            mainTitleElement.style.color = titleColors[Math.floor(Math.random() * titleColors.length)];
        }

        // 3. Tiến hành tạo ảnh như bình thường (Dùng dữ liệu Excel cho các trang sau)
        // Gọi hàm render của bạn ở đây, ví dụ:
        renderAllPages(0); 
        
        alert("Đã cập nhật tiêu đề AI và đang tạo bộ ảnh!");
    }
}
// --- HÀM GỌI AI ĐỂ VIẾT TIÊU ĐỀ ---
async function fetchAiTitle() {
    // 1. Lấy API Keys (Giữ nguyên cách lấy của bạn)
    const geminiKey = document.querySelector('input[placeholder*="Gemini"]')?.value.trim();
    const deepseekKey = document.querySelector('input[placeholder*="Deepseek"]')?.value.trim();

    // 2. SỬA TẠI ĐÂY: Lấy đúng theo ID ai-idea-content
    const ideaInput = document.getElementById('ai-idea-content');
    const userContent = ideaInput ? ideaInput.value.trim() : "";

    if (!userContent) {
        alert("Bạn chưa gõ ý tưởng vào ô nhập nội dung!");
        return null;
    }
    const prompt = `Bạn là chuyên gia viral TikTok. Hãy viết 1 tiêu đề ngắn (dưới 10 từ) cho ảnh bìa du lịch từ ý tưởng: "${userContent}". 
    Yêu cầu: Thu hút, có emoji, chỉ trả về duy nhất text tiêu đề, không để dấu ngoặc kép hay giải thích gì thêm.`;

    try {
        // Ưu tiên DeepSeek nếu có key, không thì dùng Gemini
        if (deepseekKey && deepseekKey.length > 20) {
            const response = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${deepseekKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } 
        else if (geminiKey && geminiKey.length > 20) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text.trim();
        } 
        else {
            alert("Vui lòng nhập API Key hợp lệ (ít nhất 20 ký tự)!");
            return null;
        }
    } catch (error) {
        console.error("Lỗi AI:", error);
        alert("Lỗi kết nối AI. Hãy kiểm tra lại Key hoặc mạng!");
        return null;
    }
}

// --- HÀM KHI BẤM NÚT "TẠO BỘ ẢNH AI" ---
async function generateAISet() {
    const mainTitleElement = document.querySelector('#tiktok-cover-page .main-title');
    if (!mainTitleElement) return;

    // Hiệu ứng chờ trên giao diện
    const originalTitle = mainTitleElement.innerText;
    mainTitleElement.innerText = "⏳ AI đang nghĩ tiêu đề...";

    const aiTitle = await fetchAiTitle();

    if (aiTitle) {
        // Cập nhật tiêu đề mới
        mainTitleElement.innerText = aiTitle;
        // Đổi màu ngẫu nhiên cho bắt mắt
        mainTitleElement.style.color = titleColors[Math.floor(Math.random() * titleColors.length)];
        
        // Sau đó tự động chạy hàm tạo ảnh hiện có của bạn
        alert("AI đã viết xong! Bắt đầu tạo bộ ảnh...");
        renderAllPages(0); 
    } else {
        mainTitleElement.innerText = originalTitle;
    }
}
