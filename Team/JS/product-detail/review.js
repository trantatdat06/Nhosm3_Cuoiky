/* --- assets/js/review.js --- */

// 1. CẤU HÌNH & DỮ LIỆU KHỞI TẠO
const STORAGE_KEY = 'tiem_an_vat_reviews'; 

// Dữ liệu mẫu (Cập nhật cấu trúc: replies là một mảng)
const seedData = [
    {
        id: 1,
        name: "Nguyễn Văn A",
        rating: 5,
        content: "Đồ ăn vặt ở đây siêu ngon, đóng gói kỹ, giao hàng nhanh. Sẽ ủng hộ dài dài!",
        date: "10:30 28/11/2025",
        verified: true,
        image: null,
        likes: 12,
        replies: [
            {
                name: "Tiệm Ăn Vặt",
                isAdmin: true,
                content: "Cảm ơn bạn đã ủng hộ Tiệm nhé! Mong bạn quay lại sớm ạ.",
                date: "10:45 28/11/2025"
            }
        ]
    },
    {
        id: 2,
        name: "Trần Thị B",
        rating: 4,
        content: "Ngon nhưng hơi cay so với mình. Lần sau sẽ note ít cay lại.",
        date: "14:15 29/11/2025",
        verified: true,
        image: null,
        likes: 5,
        replies: [] // Chưa có trả lời
    }
];

let reviews = []; 
let currentRating = 5; 
let currentImageBase64 = null; 

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('review-list-view')) {
        loadReviews();
        setupEventListeners();
    }
});

// 2. TẢI DỮ LIỆU
function loadReviews() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        reviews = JSON.parse(data);
        // Tương thích ngược: Nếu dữ liệu cũ chưa có mảng replies, thêm vào
        reviews.forEach(r => {
            if (!r.replies) r.replies = [];
            // Chuyển đổi reply cũ (dạng chuỗi) sang dạng mảng mới nếu cần
            if (r.reply && typeof r.reply === 'string') {
                r.replies.push({
                    name: "Tiệm Ăn Vặt",
                    isAdmin: true,
                    content: r.reply,
                    date: r.date
                });
                delete r.reply; // Xóa trường cũ
            }
        });
    } else {
        reviews = seedData;
        saveReviews(); 
    }
    renderAll(); 
}

// 3. LƯU DỮ LIỆU
function saveReviews() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

// 4. VẼ GIAO DIỆN
function renderAll(filterType = 'all') {
    renderDashboard();
    renderReviewList(filterType);
}

function renderDashboard() {
    const total = reviews.length;
    if (total === 0) return;

    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = (sum / total).toFixed(1);

    const scoreNum = document.querySelector('.score-num');
    const scoreCount = document.querySelector('.score-count');
    if(scoreNum) scoreNum.innerText = avg;
    if(scoreCount) scoreCount.innerText = `(${total} đánh giá)`;

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => counts[r.rating]++);

    const barItems = document.querySelectorAll('.rating-bars .bar-item');
    if(barItems.length > 0) {
        for (let i = 5; i >= 1; i--) {
            const percent = Math.round((counts[i] / total) * 100);
            const index = 5 - i; 
            if (barItems[index]) {
                barItems[index].querySelector('.progress-fill').style.width = `${percent}%`;
                barItems[index].querySelector('.count-label').innerText = `${percent}%`;
            }
        }
    }
    
    // Cập nhật bộ lọc
    const filterBtns = document.querySelectorAll('.filter-btn');
    if(filterBtns.length > 0) {
        if(filterBtns[1]) filterBtns[1].innerText = `5 Sao (${counts[5]})`;
        if(filterBtns[2]) filterBtns[2].innerText = `4 Sao (${counts[4]})`;
        const hasImgCount = reviews.filter(r => r.image).length;
        if(filterBtns[filterBtns.length - 1]) 
            filterBtns[filterBtns.length - 1].innerText = `Có hình ảnh (${hasImgCount})`;
    }
}

// --- HÀM VẼ DANH SÁCH (QUAN TRỌNG NHẤT) ---
function renderReviewList(filterType) {
    const container = document.querySelector('.user-review-list');
    if(!container) return;
    
    container.innerHTML = ''; 

    let displayList = reviews;
    if (filterType === '5') displayList = reviews.filter(r => r.rating === 5);
    else if (filterType === '4') displayList = reviews.filter(r => r.rating === 4);
    else if (filterType === '3') displayList = reviews.filter(r => r.rating === 3);
    else if (filterType === 'image') displayList = reviews.filter(r => r.image);

    if (displayList.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:30px; color:#999;">Chưa có đánh giá nào phù hợp.</p>';
        return;
    }

    displayList.forEach(review => {
        // Tạo sao
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= review.rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
        }

        // Tạo ảnh (Có onclick xem to)
        let imgHtml = '';
        if (review.image) {
            imgHtml = `
                <div class="review-img-wrapper" style="margin-bottom: 10px; margin-top: 5px;">
                    <img src="${review.image}" 
                        alt="Ảnh review" 
                        style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; cursor: zoom-in; border: 1px solid #eee;"
                        onclick="openImageViewer('${review.image}')">
                </div>
            `;
        }

        // --- XỬ LÝ PHẦN TRẢ LỜI (REPLIES) ---
        let repliesHtml = '';
        if (review.replies && review.replies.length > 0) {
            repliesHtml = `<div class="reply-list">`;
            review.replies.forEach(rep => {
                const badge = rep.isAdmin ? `<span class="reply-badge">QTV</span>` : '';
                repliesHtml += `
                    <div class="reply-item">
                        <div>
                            ${badge} <span class="reply-name">${rep.name}</span>
                        </div>
                        <div class="reply-content">${rep.content}</div>
                        <span class="reply-time">${rep.date}</span>
                    </div>
                `;
            });
            repliesHtml += `</div>`;
        }

        // HTML chính
        const itemHtml = `
            <div class="review-item" id="review-${review.id}">
                <div class="ri-user-info">
                    <span class="ri-name">${review.name}</span>
                    <span class="ri-stars">${starsHtml}</span>
                </div>
                ${review.verified ? '<div class="ri-verified"><i class="fa-solid fa-circle-check"></i> Đã mua hàng tại Tiệm</div>' : ''}
                <div class="ri-content">${review.content}</div>
                ${imgHtml}
                
                <div class="ri-actions">
                    <span class="action-link" onclick="toggleReplyInput(${review.id})">
                        <i class="fa-regular fa-comment-dots"></i> Gửi trả lời
                    </span> • 
                    <span class="action-link" onclick="handleLike(${review.id})">
                        <i class="fa-regular fa-thumbs-up"></i> Hữu ích (<span class="like-count">${review.likes}</span>)
                    </span> • 
                    <span class="ri-time">• ${review.date}</span>
                </div>

                ${repliesHtml}

                <div id="reply-box-${review.id}" class="reply-input-box">
                    <input type="text" id="reply-name-${review.id}" placeholder="Nhập tên của bạn...">
                    <input type="text" id="reply-content-${review.id}" placeholder="Viết câu trả lời...">
                    <div style="text-align: right;">
                        <button class="btn-submit-reply" onclick="submitReply(${review.id})">Gửi trả lời</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });
}

// 5. CÀI ĐẶT SỰ KIỆN CƠ BẢN
function setupEventListeners() {
    // Sự kiện click sao
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            currentRating = parseInt(this.getAttribute('data-value'));
            stars.forEach(s => {
                const val = parseInt(s.getAttribute('data-value'));
                if (val <= currentRating) s.classList.add('active');
                else s.classList.remove('active');
            });
        });
    });

    // Sự kiện chọn ảnh
    const fileInput = document.getElementById('review-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    currentImageBase64 = evt.target.result; 
                    document.getElementById('preview-container').innerHTML = `<img src="${evt.target.result}" class="preview-img">`;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Sự kiện gửi review chính
    const form = document.querySelector('.review-input-group');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault(); 
            submitNewReview();
        }
    }

    // Sự kiện bộ lọc
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const text = this.innerText;
            if(text.includes('Tất cả')) renderAll('all');
            else if(text.includes('5 Sao')) renderAll('5');
            else if(text.includes('4 Sao')) renderAll('4');
            else if(text.includes('Có hình ảnh')) renderAll('image');
            else renderAll('all'); 
        });
    });
}

// 6. LOGIC GỬI REVIEW CHÍNH
function submitNewReview() {
    const nameInput = document.querySelector('.review-input-group input[type="text"]');
    const contentInput = document.querySelector('.textarea-wrapper textarea');

    if (!nameInput.value.trim() || !contentInput.value.trim()) {
        alert("Vui lòng nhập tên và nội dung đánh giá!");
        return;
    }

    const newReview = {
        id: Date.now(), 
        name: nameInput.value,
        rating: currentRating,
        content: contentInput.value,
        date: new Date().toLocaleString('vi-VN'),
        verified: true, 
        image: currentImageBase64,
        likes: 0,
        replies: [] 
    };

    reviews.unshift(newReview);
    saveReviews(); 
    
    nameInput.value = '';
    contentInput.value = '';
    document.getElementById('preview-container').innerHTML = '';
    currentImageBase64 = null;
    
    toggleReviewForm(false);
    renderAll(); 
    if(typeof showToast === 'function') showToast("Đánh giá thành công!", "success");
}

function handleLike(id) {
    const review = reviews.find(r => r.id === id);
    if (review) {
        review.likes++;
        saveReviews();
        renderAll(); 
    }
}

function toggleReviewForm(show) {
    const listView = document.getElementById("review-list-view");
    const formView = document.getElementById("review-form-view");
    if (show) {
        listView.style.display = "none";
        formView.style.display = "block";
    } else {
        listView.style.display = "block";
        formView.style.display = "none";
    }
}

// --- 7. LOGIC MỚI: TRẢ LỜI BÌNH LUẬN (REPLY) ---

// Hàm hiện/ẩn khung nhập liệu
function toggleReplyInput(reviewId) {
    const box = document.getElementById(`reply-box-${reviewId}`);
    if (box) {
        if (box.style.display === 'block') {
            box.style.display = 'none';
        } else {
            // Ẩn tất cả các box khác đang mở cho gọn
            document.querySelectorAll('.reply-input-box').forEach(b => b.style.display = 'none');
            box.style.display = 'block';
        }
    }
}

// Hàm gửi câu trả lời
function submitReply(reviewId) {
    const nameVal = document.getElementById(`reply-name-${reviewId}`).value.trim();
    const contentVal = document.getElementById(`reply-content-${reviewId}`).value.trim();

    if (!nameVal || !contentVal) {
        alert("Vui lòng nhập tên và nội dung trả lời!");
        return;
    }

    // Tìm review cần trả lời
    const reviewIndex = reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
        const newReply = {
            name: nameVal,
            content: contentVal,
            date: new Date().toLocaleString('vi-VN'),
            isAdmin: false // Người dùng thường
        };

        // Đẩy vào mảng replies của review đó
        if (!reviews[reviewIndex].replies) reviews[reviewIndex].replies = [];
        reviews[reviewIndex].replies.push(newReply);

        saveReviews(); // Lưu
        renderAll();   // Vẽ lại
        
        if(typeof showToast === 'function') showToast("Đã gửi câu trả lời!", "success");
    }
}

// --- 8. LOGIC XEM ẢNH TO (LIGHTBOX) ---
function openImageViewer(src) {
    const modal = document.getElementById('modal-image-overlay');
    const img = document.getElementById('full-image-view');
    if (modal && img) {
        img.src = src; 
        modal.classList.add('active');
    }
}

function closeImageViewer() {
    const modal = document.getElementById('modal-image-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            const img = document.getElementById('full-image-view');
            if(img) img.src = ""; 
        }, 300);
    }
}