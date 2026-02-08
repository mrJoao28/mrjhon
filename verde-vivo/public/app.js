const state = {
  products: [],
  featured: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem("cart") || "[]"),
  activeCategory: "Todos",
};

const fallbackProducts = [
  {
    id: "cel-aurora-14",
    name: "Aurora 14 Pro",
    brand: "Nordic Mobile",
    category: "Celulares",
    price: 5299,
    rating: 4.9,
    featured: true,
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    description:
      "Smartphone premium com câmera quádrupla, 512GB e bateria de longa duração.",
  },
  {
    id: "tab-forest-10",
    name: "Forest Tab 10",
    brand: "Evergreen",
    category: "Tablets",
    price: 3499,
    rating: 4.7,
    featured: true,
    image:
      "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=900&q=80",
    description:
      "Tablet com caneta inteligente e tela imersiva para estudos e criatividade.",
  },
  {
    id: "pc-cedar-15",
    name: "CedarBook 15",
    brand: "Brisa",
    category: "Computadores",
    price: 7899,
    rating: 4.8,
    featured: true,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
    description:
      "Notebook com chip de alto desempenho, 32GB RAM e display Liquid.",
  },
];

const formatCurrency = (value) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const cartCount = document.getElementById("cart-count");
const cart = document.getElementById("cart");
const cartToggle = document.getElementById("cart-toggle");
const closeCart = document.getElementById("close-cart");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutMessage = document.getElementById("checkout-message");
const productsGrid = document.getElementById("products-grid");
const featuredGrid = document.getElementById("featured-grid");
const categoryChips = document.getElementById("category-chips");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

const updateCartUI = () => {
  cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  cartItems.innerHTML = state.cart
    .map(
      (item) => `
        <div class="cart-item">
          <strong>${item.name}</strong>
          <span>${item.quantity}x ${formatCurrency(item.price)}</span>
        </div>
      `
    )
    .join("");

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatCurrency(total);
  localStorage.setItem("cart", JSON.stringify(state.cart));
};

const addToCart = (product) => {
  const existing = state.cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }
  updateCartUI();
};

const renderProducts = (products, container) => {
  container.innerHTML = products
    .map(
      (product) => `
        <article class="card">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
          </div>
          <div class="meta">
            <span>${formatCurrency(product.price)}</span>
            <span>⭐ ${product.rating}</span>
          </div>
          <button class="solid" data-id="${product.id}">Adicionar</button>
        </article>
      `
    )
    .join("");

  container.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === button.dataset.id);
      if (product) {
        addToCart(product);
      }
    });
  });
};

const renderCategories = () => {
  const categories = ["Todos", ...state.categories];
  categoryChips.innerHTML = categories
    .map(
      (category) => `
        <span class="chip ${category === state.activeCategory ? "active" : ""}" data-category="${category}">
          ${category}
        </span>
      `
    )
    .join("");

  categoryChips.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.activeCategory = chip.dataset.category;
      filterProducts();
      renderCategories();
    });
  });
};

const filterProducts = () => {
  let filtered = state.products;
  if (state.activeCategory !== "Todos") {
    filtered = filtered.filter((item) => item.category === state.activeCategory);
  }
  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((item) =>
      [item.name, item.brand, item.description].some((field) =>
        field.toLowerCase().includes(query)
      )
    );
  }
  renderProducts(filtered, productsGrid);
};

const fetchData = async () => {
  try {
    const [productsRes, featuredRes, categoriesRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/featured"),
      fetch("/api/categories"),
    ]);

    if (!productsRes.ok || !featuredRes.ok || !categoriesRes.ok) {
      throw new Error("Falha ao carregar API");
    }

    state.products = await productsRes.json();
    state.featured = await featuredRes.json();
    state.categories = await categoriesRes.json();
  } catch (error) {
    state.products = fallbackProducts;
    state.featured = fallbackProducts.filter((item) => item.featured);
    state.categories = Array.from(new Set(fallbackProducts.map((item) => item.category)));
  }

  renderProducts(state.featured, featuredGrid);
  renderCategories();
  filterProducts();
  updateCartUI();
};

cartToggle.addEventListener("click", () => cart.classList.add("open"));
closeCart.addEventListener("click", () => cart.classList.remove("open"));
searchBtn.addEventListener("click", filterProducts);
searchInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    filterProducts();
  }
});

checkoutBtn.addEventListener("click", async () => {
  if (state.cart.length === 0) {
    checkoutMessage.textContent = "Seu carrinho está vazio.";
    return;
  }

  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: state.cart.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
      })),
      customer: { name: "Cliente Verde" },
    }),
  });

  const result = await response.json();
  checkoutMessage.textContent = `${result.message} Pedido ${result.orderId}. Entrega ${result.estimatedDelivery}.`;
  state.cart = [];
  updateCartUI();
});

fetchData();
