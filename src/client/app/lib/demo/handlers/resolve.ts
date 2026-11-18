import {
  demoId,
  findDemoUserByEmail,
  getCartOwnerKey,
  getCurrentDemoUser,
  getDemoState,
  loginDemoUser,
  logoutDemoUser,
  setDemoState,
} from "../index";
import type { DemoCartItem, DemoOrder } from "../types";

type DemoRequest = {
  url: string;
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
};

function ok<T extends Record<string, unknown>>(data: T, message = "Success") {
  return { success: true, message, ...data };
}

function notFound(message: string) {
  return {
    error: { status: 404, data: { success: false, message } },
  };
}

function parseUrl(url: string): { pathname: string; search: URLSearchParams } {
  const [path, query = ""] = url.split("?");
  const pathname = path.startsWith("/") ? path : `/${path}`;
  return { pathname, search: new URLSearchParams(query) };
}

function findVariant(variantId: string) {
  const state = getDemoState();
  return state.variants.find((v) => v.id === variantId);
}

function getOrCreateCart() {
  const key = getCartOwnerKey();
  const state = getDemoState();
  return state.carts[key] ?? { id: `demo-cart-${key}`, cartItems: [] };
}

function saveCart(cart: ReturnType<typeof getOrCreateCart>) {
  const key = getCartOwnerKey();
  setDemoState((s) => ({
    ...s,
    carts: { ...s.carts, [key]: cart },
  }));
}

function handleAuth(
  pathname: string,
  method: string,
  body: Record<string, unknown> | undefined
) {
  if (pathname === "/auth/sign-in" && method === "POST") {
    const email = String(body?.email ?? "");
    const user = findDemoUserByEmail(email);
    if (!user) {
      return {
        error: {
          status: 401,
          data: { success: false, message: "Неверная почта или пароль" },
        },
      };
    }
    loginDemoUser(user);
    return { data: ok({ user, accessToken: "demo-token" }, "Вход выполнен") };
  }

  if ((pathname === "/auth/register" || pathname === "/auth/sign-up") && method === "POST") {
    const email = String(body?.email ?? "");
    const existing = findDemoUserByEmail(email);
    if (existing) {
      return {
        error: {
          status: 400,
          data: { success: false, message: "Этот адрес уже зарегистрирован" },
        },
      };
    }
    const user = {
      id: demoId("demo-user"),
      name: String(body?.name ?? "New User"),
      email,
      role: "USER" as const,
      emailVerified: true,
      avatar: null,
    };
    setDemoState((s) => ({ ...s, users: [...s.users, user] }));
    loginDemoUser(user);
    return { data: ok({ user, accessToken: "demo-token" }, "Registered") };
  }

  if (pathname === "/auth/sign-out") {
    logoutDemoUser();
    return { data: ok({}, "Вы вышли из аккаунта") };
  }

  if (pathname === "/auth/refresh-token" && method === "POST") {
    const user = getCurrentDemoUser();
    if (!user) {
      return {
        error: { status: 401, data: { success: false, message: "Unauthorized" } },
      };
    }
    return { data: ok({ user, accessToken: "demo-token" }) };
  }

  if (pathname === "/auth/forgot-password" || pathname === "/auth/reset-password") {
    return { data: ok({}, "Письмо отправлено (демо)") };
  }

  return null;
}

function handleUsers(pathname: string, method: string, body?: Record<string, unknown>) {
  const state = getDemoState();
  const current = getCurrentDemoUser();

  if (pathname === "/users/me" && method === "GET") {
    if (!current) {
      return {
        error: { status: 401, data: { success: false, message: "Unauthorized" } },
      };
    }
    return { data: ok({ user: current }) };
  }

  if (pathname === "/users" && method === "GET") {
    return { data: ok({ users: state.users }) };
  }

  if (pathname === "/users/admins" && method === "GET") {
    return {
      data: ok({
        users: state.users.filter((u) => u.role === "ADMIN" || u.role === "SUPERADMIN"),
      }),
    };
  }

  const profileMatch = pathname.match(/^\/users\/profile\/(.+)$/);
  if (profileMatch && method === "GET") {
    const user = state.users.find((u) => u.id === profileMatch[1]);
    if (!user) return notFound("Пользователь не найден");
    return { data: ok({ user }) };
  }

  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === "PUT") {
    const id = userMatch[1];
    setDemoState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === id ? { ...u, ...(body as Partial<typeof u>) } : u
      ),
    }));
    const user = getDemoState().users.find((u) => u.id === id);
    return { data: ok({ user }, "Пользователь обновлён") };
  }

  if (userMatch && method === "DELETE") {
    const id = userMatch[1];
    setDemoState((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== id),
    }));
    return { data: ok({}, "Пользователь удалён") };
  }

  if (pathname === "/users/admin" && method === "POST") {
    const user = {
      id: demoId("demo-user"),
      name: String(body?.name ?? "Администратор"),
      email: String(body?.email ?? ""),
      role: "ADMIN" as const,
      emailVerified: true,
      avatar: null,
    };
    setDemoState((s) => ({ ...s, users: [...s.users, user] }));
    return { data: ok({ user }, "Администратор создан") };
  }

  return null;
}

function handleCart(pathname: string, method: string, body?: Record<string, unknown>) {
  if (pathname === "/cart" && method === "GET") {
    const cart = getOrCreateCart();
    return { data: ok({ cart }) };
  }

  if (pathname === "/cart/count" && method === "GET") {
    const cart = getOrCreateCart();
    const count = cart.cartItems.reduce((n, i) => n + i.quantity, 0);
    return { data: ok({ count }) };
  }

  if (pathname === "/cart" && method === "POST") {
    const variantId = String(body?.variantId ?? "");
    const quantity = Number(body?.quantity ?? 1);
    const variant = findVariant(variantId);
    if (!variant) return notFound("Вариант товара не найден");

    const cart = getOrCreateCart();
    const existing = cart.cartItems.find((i) => i.variant.id === variantId);
    let cartItems: DemoCartItem[];

    if (existing) {
      cartItems = cart.cartItems.map((i) =>
        i.variant.id === variantId
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      const product = getDemoState().products.find((p) => p.id === variant.productId);
      cartItems = [
        ...cart.cartItems,
        {
          id: demoId("ci"),
          quantity,
          variant: {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            images: [],
            stock: variant.stock,
            product: {
              id: product?.id ?? variant.productId,
              name: product?.name ?? "Product",
              slug: product?.slug ?? "",
            },
          },
        },
      ];
    }

    saveCart({ ...cart, cartItems });
    return { data: ok({ cart: { ...cart, cartItems } }, "Добавлено в корзину") };
  }

  const itemMatch = pathname.match(/^\/cart\/item\/(.+)$/);
  if (itemMatch && method === "PUT") {
    const id = itemMatch[1];
    const quantity = Number(body?.quantity ?? 1);
    const cart = getOrCreateCart();
    const cartItems = cart.cartItems.map((i) =>
      i.id === id ? { ...i, quantity } : i
    );
    saveCart({ ...cart, cartItems });
    return { data: ok({ cart: { ...cart, cartItems } }) };
  }

  if (itemMatch && method === "DELETE") {
    const id = itemMatch[1];
    const cart = getOrCreateCart();
    const cartItems = cart.cartItems.filter((i) => i.id !== id);
    saveCart({ ...cart, cartItems });
    return { data: ok({ cart: { ...cart, cartItems } }) };
  }

  return null;
}

function handleCheckout() {
  const current = getCurrentDemoUser();
  if (!current) {
    return {
      error: { status: 401, data: { success: false, message: "Необходимо войти в аккаунт" } },
    };
  }

  const cart = getOrCreateCart();
  if (!cart.cartItems.length) {
    return {
      error: { status: 400, data: { success: false, message: "Корзина пуста" } },
    };
  }

  const amount = cart.cartItems.reduce(
    (sum, i) => sum + i.variant.price * i.quantity,
    0
  );

  const order: DemoOrder = {
    id: demoId("demo-order"),
    userId: current.id,
    status: "PROCESSING",
    amount,
    orderDate: new Date().toISOString(),
    orderItems: cart.cartItems.map((i) => ({
      id: demoId("oi"),
      quantity: i.quantity,
      price: i.variant.price,
      productName: i.variant.product.name,
      variant: {
        id: i.variant.id,
        sku: i.variant.sku,
        product: i.variant.product,
      },
    })),
  };

  setDemoState((s) => ({
    ...s,
    orders: [order, ...s.orders],
    transactions: [
      {
        id: demoId("demo-tx"),
        amount,
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        user: { id: current.id, name: current.name, email: current.email },
        order: { id: order.id },
      },
      ...s.transactions,
    ],
    carts: { ...s.carts, [getCartOwnerKey()]: { ...cart, cartItems: [] } },
  }));

  return {
    data: ok({ sessionId: "demo-checkout", orderId: order.id }, "Заказ оформлен"),
  };
}

function handleOrders(pathname: string, method: string, body?: Record<string, unknown>) {
  const state = getDemoState();
  const current = getCurrentDemoUser();

  if (pathname === "/orders/user" && method === "GET") {
    const orders = current
      ? state.orders.filter((o) => o.userId === current.id)
      : [];
    return { data: ok({ orders }) };
  }

  if (pathname === "/orders" && method === "GET") {
    return { data: ok({ orders: state.orders }) };
  }

  const orderMatch = pathname.match(/^\/orders\/(.+)$/);
  if (orderMatch && method === "GET") {
    const order = state.orders.find((o) => o.id === orderMatch[1]);
    if (!order) return notFound("Заказ не найден");
    return { data: ok({ order }) };
  }

  if (orderMatch && method === "PUT") {
    const id = orderMatch[1];
    const status = String(body?.status ?? "PROCESSING");
    setDemoState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
    const order = getDemoState().orders.find((o) => o.id === id);
    return { data: ok({ order }) };
  }

  if (orderMatch && method === "DELETE") {
    const id = orderMatch[1];
    setDemoState((s) => ({
      ...s,
      orders: s.orders.filter((o) => o.id !== id),
    }));
    return { data: ok({}, "Заказ удалён") };
  }

  return null;
}

function handleProducts(
  pathname: string,
  method: string,
  body: Record<string, unknown> | undefined,
  search: URLSearchParams
) {
  const state = getDemoState();

  if (pathname === "/products" && method === "GET") {
    return handleProductsList(search);
  }

  if (pathname === "/products" && method === "POST") {
    const id = demoId("demo-prod");
    const product = {
      id,
      slug: String(body?.name ?? "product").toLowerCase().replace(/\s+/g, "-"),
      name: String(body?.name ?? "Новинка"),
      description: String(body?.description ?? ""),
      isNew: body?.isNew === true || body?.isNew === "true",
      isFeatured: body?.isFeatured === true || body?.isFeatured === "true",
      isTrending: body?.isTrending === true || body?.isTrending === "true",
      isBestSeller: body?.isBestSeller === true || body?.isBestSeller === "true",
      categoryId: String(body?.categoryId ?? state.categories[0]?.id ?? ""),
      variants: [],
    };
    setDemoState((s) => ({ ...s, products: [...s.products, product] }));
    return { data: ok({ product }, "Товар создан") };
  }

  const slugMatch = pathname.match(/^\/products\/slug\/(.+)$/);
  if (slugMatch && method === "GET") {
    const product = state.products.find((p) => p.slug === slugMatch[1]);
    if (!product) return notFound("Товар не найден");
    return { data: ok({ product }) };
  }

  const idMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (idMatch && method === "GET") {
    const product = state.products.find((p) => p.id === idMatch[1]);
    if (!product) return notFound("Товар не найден");
    return { data: ok({ product }) };
  }

  if (idMatch && method === "PUT") {
    const id = idMatch[1];
    setDemoState((s) => ({
      ...s,
      products: s.products.map((p) =>
        p.id === id ? { ...p, ...(body as Partial<typeof p>) } : p
      ),
    }));
    const product = getDemoState().products.find((p) => p.id === id);
    return { data: ok({ product }) };
  }

  if (idMatch && method === "DELETE") {
    const id = idMatch[1];
    setDemoState((s) => ({
      ...s,
      products: s.products.filter((p) => p.id !== id),
      variants: s.variants.filter((v) => v.productId !== id),
    }));
    return { data: ok({}, "Товар удалён") };
  }

  if (pathname === "/products/bulk" && method === "POST") {
    return { data: ok({ imported: 0 }, "Импорт выполнен в деморежиме") };
  }

  return null;
}

function handleProductsList(search: URLSearchParams) {
  const state = getDemoState();
  let products = [...state.products];
  const searchQuery = search.get("searchQuery");
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }
  const category = search.get("category");
  if (category) {
    products = products.filter((p) => p.categoryId === category);
  }
  const page = Number(search.get("page") || 1);
  const limit = Number(search.get("limit") || 50);
  const start = (page - 1) * limit;
  const slice = products.slice(start, start + limit);
  return {
    data: ok({
      products: slice,
      totalResults: products.length,
      totalPages: Math.ceil(products.length / limit) || 1,
      currentPage: page,
      resultsPerPage: limit,
    }),
  };
}

function handleCategories(pathname: string, method: string, body?: Record<string, unknown>) {
  const state = getDemoState();

  if (pathname === "/categories" && method === "GET") {
    return { data: ok({ categories: state.categories }) };
  }

  const idMatch = pathname.match(/^\/categories\/(.+)$/);
  if (idMatch && method === "GET") {
    const category = state.categories.find((c) => c.id === idMatch[1]);
    if (!category) return notFound("Категория не найдена");
    return { data: ok({ category }) };
  }

  if (pathname === "/categories" && method === "POST") {
    const category = {
      id: demoId("demo-cat"),
      slug: String(body?.slug ?? "category"),
      name: String(body?.name ?? "Категория"),
      description: String(body?.description ?? ""),
      attributes: [],
    };
    setDemoState((s) => ({ ...s, categories: [...s.categories, category] }));
    return { data: ok({ category }) };
  }

  if (idMatch && method === "PUT") {
    setDemoState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === idMatch[1] ? { ...c, ...(body as Partial<typeof c>) } : c
      ),
    }));
    const category = getDemoState().categories.find((c) => c.id === idMatch[1]);
    return { data: ok({ category }) };
  }

  if (idMatch && method === "DELETE") {
    setDemoState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== idMatch[1]),
    }));
    return { data: ok({}, "Категория удалена") };
  }

  return null;
}

function handleVariants(
  pathname: string,
  method: string,
  body: Record<string, unknown> | undefined,
  search: URLSearchParams
) {
  const state = getDemoState();

  if (pathname === "/variants" && method === "GET") {
    const page = Number(search.get("page") || 1);
    const limit = 20;
    const variants = state.variants;
    return {
      data: ok({
        variants,
        totalResults: variants.length,
        totalPages: 1,
        currentPage: page,
        resultsPerPage: limit,
      }),
    };
  }

  const idMatch = pathname.match(/^\/variants\/([^/]+)$/);
  const restockMatch = pathname.match(/^\/variants\/(.+)\/restock$/);
  const historyMatch = pathname.match(/^\/variants\/(.+)\/restock-history$/);
  const skuMatch = pathname.match(/^\/variants\/sku\/(.+)$/);

  if (skuMatch && method === "GET") {
    const variant = state.variants.find((v) => v.sku === skuMatch[1]);
    if (!variant) return notFound("Вариант товара не найден");
    return { data: ok({ variant }) };
  }

  if (idMatch && method === "GET" && !restockMatch && !historyMatch) {
    const variant = state.variants.find((v) => v.id === idMatch[1]);
    if (!variant) return notFound("Вариант товара не найден");
    return { data: ok({ variant }) };
  }

  if (pathname === "/variants" && method === "POST") {
    const variant = {
      id: demoId("demo-var"),
      productId: String(body?.productId ?? ""),
      sku: String(body?.sku ?? "SKU-001"),
      price: Number(body?.price ?? 0),
      stock: Number(body?.stock ?? 0),
      lowStockThreshold: Number(body?.lowStockThreshold ?? 5),
      attributes: [],
    };
    setDemoState((s) => ({ ...s, variants: [...s.variants, variant] }));
    return { data: ok({ variant }) };
  }

  if (idMatch && method === "PUT") {
    setDemoState((s) => ({
      ...s,
      variants: s.variants.map((v) =>
        v.id === idMatch[1] ? { ...v, ...(body as Partial<typeof v>) } : v
      ),
    }));
    const variant = getDemoState().variants.find((v) => v.id === idMatch[1]);
    return { data: ok({ variant }) };
  }

  if (restockMatch && method === "POST") {
    const qty = Number(body?.quantity ?? 0);
    setDemoState((s) => ({
      ...s,
      variants: s.variants.map((v) =>
        v.id === restockMatch[1] ? { ...v, stock: v.stock + qty } : v
      ),
    }));
    return {
      data: ok({
        restock: { id: demoId("restock"), variantId: restockMatch[1], quantity: qty },
        isLowStock: false,
      }),
    };
  }

  if (historyMatch && method === "GET") {
    return {
      data: ok({
        restocks: [],
        totalResults: 0,
        totalPages: 1,
        currentPage: 1,
        resultsPerPage: 10,
      }),
    };
  }

  if (idMatch && method === "DELETE") {
    setDemoState((s) => ({
      ...s,
      variants: s.variants.filter((v) => v.id !== idMatch[1]),
    }));
    return { data: ok({ message: "Вариант удалён" }) };
  }

  return null;
}

function handleAttributes(pathname: string, method: string, body?: Record<string, unknown>) {
  const state = getDemoState();

  if (pathname === "/attributes" && method === "GET") {
    return { data: ok({ attributes: state.attributes }) };
  }

  const idMatch = pathname.match(/^\/attributes\/(.+)$/);
  if (idMatch && method === "GET") {
    const attribute = state.attributes.find((a) => a.id === idMatch[1]);
    if (!attribute) return notFound("Характеристика не найдена");
    return { data: ok({ attribute }) };
  }

  if (pathname === "/attributes" && method === "POST") {
    const attribute = {
      id: demoId("demo-attr"),
      name: String(body?.name ?? "Attribute"),
      slug: String(body?.slug ?? "attr"),
      values: [],
    };
    setDemoState((s) => ({ ...s, attributes: [...s.attributes, attribute] }));
    return { data: ok({ attribute }) };
  }

  if (pathname === "/attributes/value" && method === "POST") {
    return { data: ok({ value: { id: demoId("val"), value: body?.value } }) };
  }

  if (pathname === "/attributes/assign-category" || pathname === "/attributes/assign-product") {
    return { data: ok({}, "Назначено (демо)") };
  }

  if (pathname.startsWith("/attributes/value/") && method === "DELETE") {
    return { data: ok({}, "Значение удалено") };
  }

  if (idMatch && method === "DELETE") {
    setDemoState((s) => ({
      ...s,
      attributes: s.attributes.filter((a) => a.id !== idMatch[1]),
    }));
    return { data: ok({}, "Характеристика удалена") };
  }

  return null;
}

function handleTransactions(pathname: string, method: string, body?: Record<string, unknown>) {
  const state = getDemoState();

  if (pathname === "/transactions" && method === "GET") {
    const txs = state.transactions;
    return {
      data: ok({
        transactions: txs,
        totalResults: txs.length,
        totalPages: 1,
        currentPage: 1,
        resultsPerPage: txs.length,
      }),
    };
  }

  const idMatch = pathname.match(/^\/transactions\/(.+)$/);
  const statusMatch = pathname.match(/^\/transactions\/status\/(.+)$/);

  if (idMatch && method === "GET" && !statusMatch) {
    const transaction = state.transactions.find((t) => t.id === idMatch[1]);
    if (!transaction) return notFound("Транзакция не найдена");
    return { data: ok({ transaction }) };
  }

  if (statusMatch && method === "PUT") {
    const id = statusMatch[1];
    const status = String(body?.status ?? "PENDING");
    setDemoState((s) => ({
      ...s,
      transactions: s.transactions.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    }));
    return { data: ok({ transaction: getDemoState().transactions.find((t) => t.id === id) }) };
  }

  if (idMatch && method === "DELETE") {
    setDemoState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== idMatch[1]),
    }));
    return { data: ok({}, "Транзакция удалена") };
  }

  return null;
}

function handleLogs(pathname: string, method: string) {
  const state = getDemoState();

  if (pathname === "/logs" && method === "GET") {
    return { data: ok({ logs: state.logs }) };
  }

  if (pathname === "/logs" && method === "DELETE") {
    setDemoState((s) => ({ ...s, logs: [] }));
    return { data: ok({}, "Журнал очищен") };
  }

  const levelMatch = pathname.match(/^\/logs\/level\/(.+)$/);
  if (levelMatch && method === "GET") {
    const logs = state.logs.filter((l) => l.level === levelMatch[1]);
    return { data: ok({ logs }) };
  }

  const idMatch = pathname.match(/^\/logs\/(.+)$/);
  if (idMatch && method === "GET") {
    const log = state.logs.find((l) => l.id === idMatch[1]);
    if (!log) return notFound("Запись не найдена");
    return { data: ok({ log }) };
  }

  if (idMatch && method === "DELETE") {
    setDemoState((s) => ({
      ...s,
      logs: s.logs.filter((l) => l.id !== idMatch[1]),
    }));
    return { data: ok({}, "Запись удалена") };
  }

  return null;
}

function handleReviews(pathname: string, method: string, body?: Record<string, unknown>) {
  const state = getDemoState();
  const current = getCurrentDemoUser();

  const productMatch = pathname.match(/^\/reviews\/(.+)$/);
  if (productMatch && method === "GET") {
    const reviews = state.reviews.filter((r) => r.productId === productMatch[1]);
    return { data: ok({ reviews }) };
  }

  if (pathname === "/reviews" && method === "POST") {
    const review = {
      id: demoId("review"),
      productId: String(body?.productId ?? ""),
      userId: current?.id ?? "guest",
      rating: Number(body?.rating ?? 5),
      comment: String(body?.comment ?? ""),
      createdAt: new Date().toISOString(),
      user: current
        ? { id: current.id, name: current.name, avatar: current.avatar }
        : undefined,
    };
    setDemoState((s) => ({ ...s, reviews: [...s.reviews, review] }));
    return { data: ok({ review }) };
  }

  if (pathname === "/reviews" && method === "DELETE") {
    const reviewId = String(body?.reviewId ?? "");
    setDemoState((s) => ({
      ...s,
      reviews: s.reviews.filter((r) => r.id !== reviewId),
    }));
    return { data: ok({}, "Отзыв удалён") };
  }

  return null;
}

export function resolveDemoRequest(req: DemoRequest): { data?: unknown; error?: unknown } {
  const url =
    typeof req.url === "string"
      ? req.url
      : String((req as { url?: string }).url ?? "");
  const method = (req.method ?? "GET").toUpperCase();
  const body = req.body as Record<string, unknown> | undefined;

  const { pathname, search } = parseUrl(url);

  if (pathname === "/checkout" && method === "POST") {
    return handleCheckout();
  }

  const handlers = [
    () => handleAuth(pathname, method, body),
    () => handleUsers(pathname, method, body),
    () => handleCart(pathname, method, body),
    () => handleOrders(pathname, method, body),
    () => handleProducts(pathname, method, body, search),
    () => handleCategories(pathname, method, body),
    () => handleVariants(pathname, method, body, search),
    () => handleAttributes(pathname, method, body),
    () => handleTransactions(pathname, method, body),
    () => handleLogs(pathname, method),
    () => handleReviews(pathname, method, body),
  ];

  if (pathname.startsWith("/analytics")) {
    return { data: ok({}, "Событие записано (демо)") };
  }

  if (pathname.startsWith("/chat")) {
    return { data: ok({ chats: [] }, "Чат недоступен в деморежиме") };
  }

  if (pathname.startsWith("/reports/generate")) {
    const blob = new Blob(["Демонстрационный отчёт"], { type: "text/plain" });
    return { data: blob };
  }

  for (const run of handlers) {
    const result = run();
    if (result) return result;
  }

  return notFound(`Demo: no handler for ${method} ${pathname}`);
}
