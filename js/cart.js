let restoredProducts = JSON.parse(localStorage.getItem('selectedProductIds')) || [];
console.log('restoredProducts: Восстановленные товары из localStorage', restoredProducts);

let products = []; // Глобальная переменная для хранения данных о товарах
let calculatedTotalPrice = 0; // Глобальная переменная для хранения итоговой стоимости

document.addEventListener('DOMContentLoaded', () => {
    if (restoredProducts.length === 0) {
        console.log("Нет сохраненных товаров в localStorage.");
        document.getElementById('empty-cart-message').style.display = 'block';
        return;
    }

    fetch("https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=f1336eca-0639-4bb2-ad9f-3c541296d69a")
        .then(response => response.json())
        .then(data => {
            console.log('fetch: Полученные данные', data);
            products = data; // Сохраняем данные в глобальной переменной
            const selectedProductsData = data.filter(product => restoredProducts.includes(product.id.toString()));
            console.log('selectedProductsData: Отфильтрованные данные', selectedProductsData);
            if (selectedProductsData.length === 0) {
                console.log("Нет товаров с сохраненными id.");
                document.getElementById('empty-cart-message').style.display = 'block';
                return;
            }
            selectedProductsData.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            displayProducts(selectedProductsData);
            updateTotalPrice(selectedProductsData);

            document.getElementById('delivery_date').addEventListener('change', () => {
                updateTotalPrice(selectedProductsData); 
            });

            document.getElementById('delivery_time').addEventListener('change', () => {
                updateTotalPrice(selectedProductsData); 
            });
        })
        .catch(error => {
            console.error("Ошибка при загрузке данных:", error);
            document.getElementById('empty-cart-message').style.display = 'block';
        });
});

function displayProducts(products) {
    const productsContainer = document.getElementById('products-container');
    console.log('displayProducts: Отображение товаров', products);

    if (!productsContainer) {
        console.error('Не найден контейнер для отображения товаров');
        return;
    }
    productsContainer.innerHTML = '';// Очищаем контейнер перед добавлением новых элементов

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.classList.add('product');
        const ratingStars = '<span style="color: gold;">' + '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating)) + '</span>';
        let priceInfo;
        if (product.discount_price) {
            const discount = Math.round((1 - product.discount_price / product.actual_price) * 100);
            priceInfo = `${product.discount_price} руб. <span style="color: red; text-decoration: line-through;">${product.actual_price} руб.</span> <span style="color: red;">-${discount}%</span>`;
        } else {
            priceInfo = `${product.actual_price} руб.`;
        }

        productElement.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: auto; object-fit: contain;">
            <h3>${product.name}</h3>
            <p>${product.rating} ${ratingStars}</p>
            <p>${priceInfo}</p>
            <button data-id="${product.id}" class="remove-from-cart">Удалить из корзины</button>
        `;
        productsContainer.appendChild(productElement);
    });

    document.getElementById('empty-cart-message').style.display = 'none';
}

function updateTotalPrice(products) {
    const totalPriceElement = document.getElementById('calculated_price');
    const deliveryCostElement = document.getElementById('delivery_cost');

    // Рассчитываем стоимость товаров
    const totalProductPrice = products.reduce((total, product) => {
        const price = product.discount_price !== null ? product.discount_price : product.actual_price;
        return total + price;
    }, 0);

    // Рассчитываем стоимость доставки
    const deliveryDate = document.getElementById('delivery_date').value;
    const deliveryTime = document.getElementById('delivery_time').value;

    const baseDeliveryCost = 200;
    let extraDeliveryCost = 0;

    if (deliveryDate) {
        const date = new Date(deliveryDate);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = воскресенье, 6 = суббота
        const isEvening = deliveryTime.startsWith('18:00');

        if (isWeekend) {
            extraDeliveryCost += 300;
        } else if (isEvening) {
            extraDeliveryCost += 200;
        }
    }

    const totalDeliveryCost = baseDeliveryCost + extraDeliveryCost;

    // Сохраняем итоговую стоимость в глобальной переменной
    calculatedTotalPrice = totalProductPrice + totalDeliveryCost;

    // Обновляем отображение
    totalPriceElement.textContent = `${calculatedTotalPrice} руб.`;
    deliveryCostElement.textContent = `(Стоимость доставки: ${totalDeliveryCost} руб.)`;
}

document.getElementById('products-container').addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-from-cart')) {
        const productId = event.target.dataset.id;
        console.log('remove-from-cart: Нажата кнопка удаления из корзины', productId);
        restoredProducts = restoredProducts.filter(id => id !== productId);
        localStorage.setItem('selectedProductIds', JSON.stringify(restoredProducts));
        event.target.closest('.product').remove();

        if (restoredProducts.length === 0) {
            document.getElementById('empty-cart-message').style.display = 'block';
        } else {
            fetch("https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=f1336eca-0639-4bb2-ad9f-3c541296d69a")
                .then(response => response.json())
                .then(data => {
                    const selectedProductsData = data.filter(product => restoredProducts.includes(product.id.toString()));
                    updateTotalPrice(selectedProductsData);
                });
        }
    }
});

document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const subscribe = document.getElementById('subscribe').checked;
    const comment = document.getElementById('comment').value;
    const address = document.getElementById('address').value;
    const deliveryDate = document.getElementById('delivery_date').value.split('-').reverse().join('.');
    const deliveryInterval = document.getElementById('delivery_time').value;

    const selectedProductsData = restoredProducts.map(id => {
        const product = products.find(p => p.id === parseInt(id)); // Найдите товар по ID
        return {
            id: product.id,
            name: product.name,
            price: product.discount_price !== null ? product.discount_price : product.actual_price
        };
    });

    const totalPrice = calculatedTotalPrice; 

    const orderData = {
        full_name: fullName,
        phone: phone,
        email: email,
        subscribe: subscribe,
        comment: comment,
        delivery_address: address,
        delivery_date: deliveryDate,
        delivery_interval: deliveryInterval,
        good_ids: selectedProductsData.map(product => product.id),
        good_names: selectedProductsData.map(product => product.name), 
        total_price: totalPrice, 
        student_id: 10700
    };

    const ORDER_API_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders';
    const API_KEY = 'f1336eca-0639-4bb2-ad9f-3c541296d69a';
    const url = `${ORDER_API_URL}?api_key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (data.error) {
            alert(`Ошибка: ${data.error}`);
        } else {
            alert('Заказ успешно оформлен!');
            localStorage.removeItem('selectedProductIds');
            window.location.href = 'account.html';
        }
    } catch (error) {
        console.error('Ошибка при оформлении заказа:', error);
        alert('Произошла ошибка при оформлении заказа.');
    }
});