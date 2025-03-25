function openTab(tabName) {
    document.querySelectorAll('.tabcontent').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tablinks').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).style.display = 'block';
    event.currentTarget.classList.add('active');
}

let users = JSON.parse(localStorage.getItem('users')) || [];

function login(e) {
    e.preventDefault();
    const email = document.querySelector('#login input[type="email"]').value;
    const password = document.querySelector('#login input[type="password"]').value;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        window.location.href = 'medicines.html';
    } else {
        alert('Invalid email or password. Please sign up if you don’t have an account.');
    }
}

function signup(e) {
    e.preventDefault();
    const name = document.querySelector('#signup input[type="text"]').value;
    const email = document.querySelector('#signup input[type="email"]').value;
    const password = document.querySelector('#signup input[type="password"]').value;

    if (users.some(u => u.email === email)) {
        alert('Email already registered. Please log in.');
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', JSON.stringify(newUser));
    alert('Sign up successful! Redirecting to medicines...');
    window.location.href = 'medicines.html';
}

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function displayCart() {
    const container = document.getElementById('cartItems');
    const billContainer = document.getElementById('billDetails');
    if (!container || !billContainer) return;

    container.innerHTML = '';
    billContainer.innerHTML = '';

    let subtotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <h3>${item.name}</h3>
                <p>Price: ₹${item.price} x <span id="quantity-${item.id}">${item.quantity}</span> = ₹${itemTotal.toFixed(2)}</p>
                <p>Manufacturer: ${item.manufacturer_name}</p>
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
        `;
        container.appendChild(div);
    });

    const sgst = subtotal * 0.09;
    const cgst = subtotal * 0.09;
    const total = subtotal + sgst + cgst;

    billContainer.innerHTML = `
        <p class="subtotal">Subtotal: ₹${subtotal.toFixed(2)}</p>
        <p class="tax">SGST (9%): ₹${sgst.toFixed(2)}</p>
        <p class="tax">CGST (9%): ₹${cgst.toFixed(2)}</p>
        <p class="total">Total Amount: ₹${total.toFixed(2)}</p>
        <button class="proceed-btn" onclick="window.location.href='billing.html'">Proceed to Billing</button>
    `;
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) {
            item.quantity = 1;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
}

function generateOrderId() {
    return 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function getRandomDeliveryDate() {
    const days = Math.floor(Math.random() * 7) + 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate;
}

function placeOrder(event) {
    event.preventDefault();
    const orderId = generateOrderId();
    const deliveryDate = getRandomDeliveryDate();
    localStorage.setItem(`order-${orderId}`, JSON.stringify({
        status: 'Order Placed',
        deliveryDate: deliveryDate.toISOString()
    }));
    document.getElementById('successMessage').innerHTML = `Your order has been placed successfully! 🎉<br>Order ID: ${orderId}<br>Estimated Delivery: ${deliveryDate.toDateString()}`;
    document.getElementById('trackBtn').onclick = () => {
        window.location.href = `track-order.html?orderId=${orderId}`;
    };
    document.getElementById('billingForm').style.display = 'none';
    document.getElementById('successModal').style.display = 'flex';
    localStorage.removeItem('cart');
}

const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
let medicines = [];
let filteredMedicines = [];
const itemsPerPage = 9;
let currentPage = 1;

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split('\t');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const obj = {};
        headers.forEach((header, index) => {
            if (header === 'price') obj[header] = parseFloat(values[index]);
            else if (header === 'id') obj[header] = parseInt(values[index]);
            else if (header === 'Is_discontinued') obj[header] = values[index] === 'TRUE';
            else obj[header] = values[index];
        });
        obj.quantity = 50;
        obj.composition = [obj.short_composition1, obj.short_composition2].filter(Boolean).join(' + ');
        result.push(obj);
    }
    return result;
}

function displayMedicines() {
    const container = document.getElementById('medicineList');
    if (!container) return;

    container.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    filteredMedicines.slice(start, end).forEach(med => {
        const card = document.createElement('div');
        card.className = 'medicine-card';
        card.innerHTML = `
            <h3>${med.name}</h3>
            <p><strong>Price:</strong> ₹${med.price.toFixed(2)}</p>
            <p><strong>Available:</strong> ${med.quantity}</p>
            <p><strong>Manufacturer:</strong> ${med.manufacturer_name || 'N/A'}</p>
            <p><strong>Composition:</strong> ${med.composition || 'N/A'}</p>
            <button class="add-to-cart" onclick="addToCart(${med.id})" ${med.quantity === 0 || med.Is_discontinued ? 'disabled' : ''}>
                ${med.quantity === 0 ? 'Out of Stock' : med.Is_discontinued ? 'Discontinued' : 'Add to Cart'}
            </button>
        `;
        container.appendChild(card);
    });
}

function setupPagination() {
    const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayMedicines();
            setupPagination();
        }
    };
    pagination.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.disabled = i === currentPage;
        pageButton.onclick = () => {
            currentPage = i;
            displayMedicines();
            setupPagination();
        };
        pagination.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayMedicines();
            setupPagination();
        }
    };
    pagination.appendChild(nextButton);
}

function filterMedicines() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredMedicines = medicines.filter(med =>
        med.name.toLowerCase().includes(searchTerm) ||
        (med.composition && med.composition.toLowerCase().includes(searchTerm)) ||
        (med.manufacturer_name && med.manufacturer_name.toLowerCase().includes(searchTerm))
    );
    currentPage = 1;
    displayMedicines();
    setupPagination();
}

function addToCart(id) {
    const medicine = medicines.find(m => m.id === id);
    const cartItem = cart.find(item => item.id === id);
    if (medicine.quantity > 0 && !medicine.Is_discontinued) {
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...medicine, quantity: 1 });
        }
        medicine.quantity--;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayMedicines();
    }
}

function trackOrderPrompt() {
    const orderId = prompt('Enter your Order ID:');
    if (orderId) {
        window.location.href = `track-order.html?orderId=${orderId}`;
    }
}

function trackOrder() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
        const orderData = JSON.parse(localStorage.getItem(`order-${orderId}`));
        if (orderData) {
            const deliveryDate = new Date(orderData.deliveryDate);
            const today = new Date();
            const timeDiff = deliveryDate - today;
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            document.getElementById('trackingStatus').innerHTML = `Order ID: ${orderId}<br>Status: ${orderData.status}<br>Estimated Delivery: ${deliveryDate.toDateString()}<br>Days Remaining: ${daysLeft > 0 ? daysLeft : 'Delivered or Past Due'}`;
        } else {
            document.getElementById('trackingStatus').textContent = 'Order not found.';
        }
    } else {
        document.getElementById('trackingStatus').textContent = 'Invalid or missing Order ID.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.className;
    
    if (page === 'index') {
    } else if (page === 'cart') {
        displayCart();
    } else if (page === 'billing') {
    } else if (page === 'medicines') {
        if (!loggedInUser) {
            alert('Please log in to access this page.');
            window.location.href = 'index.html';
        } else {
            fetch('medicines.csv')
                .then(response => response.text())
                .then(csv => {
                    medicines = parseCSV(csv);
                    filteredMedicines = [...medicines];
                    displayMedicines();
                    setupPagination();
                })
                .catch(error => {
                    console.error('Error loading CSV:', error);
                    document.getElementById('medicineList').innerHTML = '<p style="text-align: center; color: #e53935;">Failed to load medicines. Please try again later.</p>';
                });
        }
    } else if (page === 'track-order') {
        trackOrder();
    }
});