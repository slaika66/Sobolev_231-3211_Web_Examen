document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'f1336eca-0639-4bb2-ad9f-3c541296d69a';
    const apiUrl = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods';
    const productsContainer = document.getElementById('products');
    const searchButton = document.querySelector('.search-button');
    const searchInput = document.querySelector('.search');
    const filterForm = document.getElementById('filter-form');
    const resetFiltersButton = document.getElementById('reset-filters');
    const sortOrderSelect = document.getElementById('sort-order');
    const notificationBar = document.getElementById('notification-bar');
    let products = [];
    const selectedProductIds = JSON.parse(localStorage.getItem('selectedProductIds')) || [];

    console.log('DOMContentLoaded: Инициализация переменных и элементов DOM');

    if (!productsContainer || !searchButton || !searchInput || !filterForm || !resetFiltersButton || !sortOrderSelect || !notificationBar) {
        console.error('Не найдены необходимые элементы на странице.');
        return;
    }

    /**
     * Отображает список товаров на странице.
     * Если список пуст, выводит сообщение "Товары не найдены".
     */
    function displayProducts() {
        console.log('displayProducts: Отображение товаров', products);
        if (products.length === 0) {
            productsContainer.innerHTML = '<p>Товары не найдены.</p>';
            return;
        }

        productsContainer.innerHTML = '';
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
                <button data-id="${product.id}" class="add-to-cart">Добавить в корзину</button>
            `;
            productsContainer.appendChild(productElement);
        });
        restoreSelectedProducts();
    }

    /**
     * Сохраняет идентификаторы выбранных товаров в localStorage.
     */
    function saveSelectedProductIds() {
        console.log('saveSelectedProductIds: Сохранение выбранных товаров', selectedProductIds);
        localStorage.setItem('selectedProductIds', JSON.stringify(selectedProductIds));
    }

    /**
     * Восстанавливает состояние выбранных товаров из localStorage.
     * Добавляет класс "selected" и изменяет текст кнопки для выбранных товаров.
     */
    function restoreSelectedProducts() {
        console.log('restoreSelectedProducts: Восстановление выбранных товаров', selectedProductIds);
        selectedProductIds.forEach(id => {
            const productElement = document.querySelector(`button[data-id="${id}"]`);
            if (productElement) {
                productElement.classList.add('selected');
                productElement.textContent = 'В корзине';
            }
        });
    }

    /**
     * Показывает уведомление с заданным сообщением и типом (например, успех или ошибка).
     * Уведомление автоматически скрывается через 3 секунды.
     */
    function showNotification(message, type) {
        notificationBar.textContent = message;
        notificationBar.className = type;
        notificationBar.style.display = 'block';
        setTimeout(() => {
            notificationBar.style.display = 'none';
        }, 3000);
    }

    /**
     * Загружает список товаров с сервера с учетом поискового запроса, фильтров и порядка сортировки.
     * Применяет фильтры и сортировку к загруженным данным перед отображением.
     */
    async function loadProducts(query = '', filters = {}, sortOrder = '') {
        console.log('loadProducts: Загрузка товаров', { query, filters, sortOrder });
        try {
            const url = new URL(apiUrl);
            url.searchParams.append('api_key', apiKey);
            if (query) {
                url.searchParams.append('query', query);
            }
            Object.keys(filters).forEach(key => {
                if (Array.isArray(filters[key])) {
                    filters[key].forEach(value => url.searchParams.append(key, value));
                } else {
                    url.searchParams.append(key, filters[key]);
                }
            });
            if (sortOrder) {
                url.searchParams.append('sort', sortOrder);
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const data = await response.json();
            console.log('loadProducts: Полученные данные', data);
            products = data || [];
            if (filters.discount) {
                products = products.filter(product => product.discount_price !== null);
            }
            if (filters.price_min || filters.price_max) {
                const priceMin = parseFloat(filters.price_min) || 0;
                const priceMax = parseFloat(filters.price_max) || Infinity;
                products = products.filter(product => {
                    const price = product.discount_price !== null ? product.discount_price : product.actual_price;
                    return price >= priceMin && price <= priceMax;
                });
            }
            if (filters.main_category) {
                products = products.filter(product => filters.main_category.includes(product.main_category));
            }
            if (sortOrder) {
                switch (sortOrder) {
                    case 'rating_desc':
                        products.sort((a, b) => b.rating - a.rating);
                        break;
                    case 'rating_asc':
                        products.sort((a, b) => a.rating - b.rating);
                        break;
                    case 'price_desc':
                        products.sort((a, b) => {
                            const priceA = a.discount_price !== null ? a.discount_price : a.actual_price;
                            const priceB = b.discount_price !== null ? b.discount_price : b.actual_price;
                            return priceB - priceA;
                        });
                        break;
                    case 'price_asc':
                        products.sort((a, b) => {
                            const priceA = a.discount_price !== null ? a.discount_price : a.actual_price;
                            const priceB = b.discount_price !== null ? b.discount_price : b.actual_price;
                            return priceA - priceB;
                        });
                        break;
                }
            }
            displayProducts();
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            if (error.message.includes('Failed to fetch')) {
                productsContainer.innerHTML = `<p>Ошибка загрузки товаров: Сервер недоступен или доменное имя введено неправильно.</p>`;
            } else {
                productsContainer.innerHTML = `<p>Ошибка загрузки товаров: ${error.message}</p>`;
            }
        }
    }

    /**
     * Обработчик клика по кнопке "Добавить в корзину".
     * Добавляет или удаляет товар из списка выбранных товаров.
     */
    productsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart')) {
            const productId = event.target.dataset.id;
            console.log('add-to-cart: Нажата кнопка добавления в корзину', productId);
            if (selectedProductIds.includes(productId)) {
                selectedProductIds.splice(selectedProductIds.indexOf(productId), 1);
                event.target.classList.remove('selected');
                event.target.textContent = 'Добавить в корзину';
                showNotification('Товар убран из корзины', 'notification-red');
            } else {
                selectedProductIds.push(productId);
                event.target.classList.add('selected');
                event.target.textContent = 'В корзине';
                showNotification('Товар добавлен в корзину', 'notification-green');
            }
            saveSelectedProductIds();
        }
    });

    /**
     * Обработчик клика по кнопке поиска.
     * Загружает товары, соответствующие введенному поисковому запросу.
     */
    searchButton.addEventListener('click', () => {
        const query = searchInput.value;
        console.log('searchButton: Нажата кнопка поиска', query);
        loadProducts(query);
    });

    /**
     * Обработчик отправки формы фильтрации.
     * Собирает данные из формы, применяет фильтры и загружает соответствующие товары.
     */
    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(filterForm);
        const filters = {};
        formData.forEach((value, key) => {
            if (!filters[key]) {
                filters[key] = [];
            }
            filters[key].push(value);
        });
        console.log('filterForm: Отправлена форма фильтрации', filters);
        loadProducts(searchInput.value, filters, sortOrderSelect.value);
    });

    /**
     * Обработчик клика по кнопке сброса фильтров.
     * Сбрасывает форму фильтрации и загружает все товары.
     */
    resetFiltersButton.addEventListener('click', () => {
        console.log('resetFiltersButton: Нажата кнопка сброса фильтров');
        filterForm.reset();
        loadProducts(searchInput.value);
    });

    /**
     * Обработчик изменения порядка сортировки.
     * Загружает товары с учетом выбранного порядка сортировки.
     */
    sortOrderSelect.addEventListener('change', () => {
        console.log('sortOrderSelect: Изменен порядок сортировки', sortOrderSelect.value);
        loadProducts(searchInput.value, {}, sortOrderSelect.value);
    });

    /**
     * Инициализирует загрузку товаров при загрузке страницы.
     */
    console.log('DOMContentLoaded: Загрузка товаров');
    loadProducts();
});