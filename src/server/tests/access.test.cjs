const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '../src', file + '.ts');
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)((id) => {
    if (id in mocks) return mocks[id];
    if (id === '@/shared/errors/AppError') return { default: AppError };
    throw new Error('Unexpected dependency: ' + id);
  }, module, module.exports);
  return module.exports;
}
const { default: AppError } = load('shared/errors/AppError');
const { CartService } = load('modules/cart/cart.service', {
  '@/infra/database/database.config': { default: {} },
});
const status = (code) => (error) => error.statusCode === code;

test('cart rejects foreign items for both guests and authenticated users', async () => {
  let writes = 0;
  const service = new CartService({
    getCartByUserId: async () => ({ cartItems: [{ id: 'owned' }] }),
    getCartBySessionId: async () => ({ cartItems: [{ id: 'owned' }] }),
    updateCartItemQuantity: async () => writes++,
    removeCartItem: async () => writes++,
  });
  for (const identity of [['user', 'session'], [undefined, 'session'], []]) {
    await assert.rejects(service.removeFromCart('foreign', ...identity), status(404));
    await assert.rejects(service.updateCartItemQuantity('foreign', 1, ...identity), status(404));
  }
  assert.equal(writes, 0);
  await service.removeFromCart('owned', 'user', 'session');
  await service.updateCartItemQuantity('owned', 2, undefined, 'session');
  assert.equal(writes, 2);
});
test('cart rejects invalid quantities before touching storage', async () => {
  const service = new CartService({});
  for (const quantity of [undefined, null, '1', NaN, Infinity, 0, -1, 1.5, 2147483648]) {
    await assert.rejects(service.addToCart('variant', quantity, 'user'), status(400));
    await assert.rejects(service.updateCartItemQuantity('item', quantity, 'user'), status(400));
  }
  await assert.rejects(service.addToCart('', 1, 'user'), status(400));
});
test('anonymous requests cannot merge carts', async () => {
  await assert.rejects(new CartService({}).mergeCartsOnLogin('session'), status(401));
});
for (const entity of ['address', 'payment']) {
  test(entity + ' deletion enforces ownership and handles missing records', async () => {
    const name = entity[0].toUpperCase() + entity.slice(1);
    const Service = load('modules/' + entity + '/' + entity + '.service')[name + 'Service'];
    let writes = 0;
    let record = { userId: 'owner' };
    const service = new Service({
      ['find' + name + 'ById']: async () => record,
      ['delete' + name]: async () => writes++,
    });
    await assert.rejects(service['delete' + name]('id', 'stranger'), status(403));
    assert.equal(writes, 0);
    await service['delete' + name]('id', 'owner');
    assert.equal(writes, 1);
    record = null;
    await assert.rejects(service['delete' + name]('missing', 'owner'), status(404));
  });
}
test('only review author or staff can delete a review', async () => {
  const { ReviewService } = load('modules/review/review.service', {
    '@/infra/database/database.config': { default: {} },
  });
  let writes = 0;
  const service = new ReviewService({
    findReviewById: async () => ({ userId: 'owner', productId: 'product' }),
    deleteReview: async () => writes++,
    updateProductRating: async () => {},
  });
  await assert.rejects(service.deleteReview('review', 'stranger', 'USER'), status(403));
  assert.equal(writes, 0);
  await service.deleteReview('review', 'owner');
  await service.deleteReview('review', 'staff', 'ADMIN');
  await service.deleteReview('review', 'staff', 'SUPERADMIN');
  assert.equal(writes, 3);
});
test('chat denies foreign readers and senders before file upload or writes', async () => {
  const { ChatService } = load('modules/chat/chat.service', {
    cloudinary: { v2: {} }, stream: require('node:stream'),
  });
  let writes = 0;
  const service = new ChatService({
    findChatById: async () => ({ userId: 'owner' }),
    createMessage: async () => { writes++; return {}; },
  }, { to: () => ({ emit() {} }) });
  await assert.rejects(service.getChat('chat', 'stranger', 'USER'), status(403));
  await assert.rejects(service.sendMessage('chat', 'text', 'stranger', 'USER'), status(403));
  assert.equal(writes, 0);
  await service.getChat('chat', 'owner', 'USER');
  await service.getChat('chat', 'staff', 'ADMIN');
  await assert.rejects(service.sendMessage('chat', '  ', 'owner', 'USER'), status(400));
  await service.sendMessage('chat', 'hello', 'owner', 'USER');
  assert.equal(writes, 1);
  await assert.rejects(service.updateChatStatus('chat', 'INVALID'), status(400));
});
test('chat queries never select password or full user records', async () => {
  const calls = [];
  const capture = async (args) => { calls.push(args); return {}; };
  const { ChatRepository } = load('modules/chat/chat.repository', {
    '@/infra/database/database.config': { default: {
      chat: { create: capture, findMany: capture, findUnique: capture, update: capture },
      chatMessage: { create: capture },
    } },
  });
  const repo = new ChatRepository();
  await repo.createChat('u');
  await repo.findChatById('c');
  await repo.findChatsByUser('u');
  await repo.findAllChats();
  await repo.createMessage('c', 'u', 'hello');
  await repo.updateChatStatus('c', 'OPEN');
  for (const args of calls) {
    const check = (value) => {
      for (const [key, child] of Object.entries(value)) {
        if (key === 'user' || key === 'sender') {
          assert.deepEqual(Object.keys(child.select).sort(), ['avatar', 'id', 'name', 'role']);
        }
        if (child && typeof child === 'object') check(child);
      }
    };
    check(args);
  }
});
test('webhook uses paid line items, preserves cart additions and decrements stock conditionally', async () => {
  const writes = [];
  const session = {
    id: 'cs_paid', payment_status: 'paid', amount_total: 2000,
    metadata: { userId: 'owner', cartId: 'cart' },
    payment_method_types: ['card'],
    customer_details: { address: { city: 'Billing city', line1: 'Billing street' } },
    collected_information: { shipping_details: { address: {
      city: 'Алматы', country: 'KZ', postal_code: '050000',
      line1: 'Улица доставки, 10', line2: 'Квартира 5',
    } } },
  };
  const capture = (name, result = {}) => async (args) => { writes.push([name, args]); return result; };
  const tx = {
    order: { create: capture('order', { id: session.id }) },
    payment: { create: capture('payment') },
    transaction: { create: capture('transaction') },
    shipment: { create: capture('shipment') },
    address: { create: capture('address') },
    productVariant: {
      updateMany: capture('stock', { count: 1 }),
      findUniqueOrThrow: async () => ({ productId: 'product' }),
    },
    product: { update: capture('sales') },
    cartItem: { deleteMany: capture('deleteItems'), updateMany: capture('updateItems'), count: async () => 1 },
    cart: { update: capture('cart') },
  };
  const prisma = {
    order: { findFirst: async () => null },
    cart: { findUnique: async () => ({ id: 'cart', userId: 'owner', cartItems: [] }) },
    cartEvent: { create: async () => {} },
    $transaction: async (work) => work(tx),
  };
  const { WebhookService } = load('modules/webhook/webhook.service', {
    '@prisma/client': require('@prisma/client'),
    '@/infra/database/database.config': { default: prisma },
    '@/infra/payment/stripe': { default: { checkout: { sessions: {
      retrieve: async () => session,
      listLineItems: () => ({ autoPagingToArray: async () => [{
        quantity: 2, price: { unit_amount: 1000, product: { metadata: { variantId: 'variant' } } },
      }] }),
    } } } },
    '@/infra/cache/redis': { default: { del: async () => {}, keys: async () => [] } },
    '../logs/logs.factory': { makeLogsService: () => ({ info: async () => {} }) },
    '../cart/cart.repository': { CartRepository: class {} },
    '../cart/cart.service': { CartService: class { async logCartEvent() {} } },
  });
  const service = new WebhookService();
  const result = await service.handleCheckoutCompletion({ id: session.id });
  const args = (name) => writes.find(([key]) => key === name)[1];
  assert.equal(result.shipment, null);
  assert.equal(writes.some(([name]) => name === 'shipment'), false);
  assert.equal(args('address').data.city, 'Алматы');
  assert.equal(args('address').data.street, 'Улица доставки, 10, Квартира 5');
  assert.equal(args('order').data.amount, 20);
  assert.deepEqual(args('order').data.orderItems.create, [{ variantId: 'variant', quantity: 2, price: 10 }]);
  assert.deepEqual(args('stock').where, { id: 'variant', stock: { gte: 2 } });
  assert.deepEqual(args('stock').data, { stock: { decrement: 2 } });
  assert.deepEqual(args('sales').data, { salesCount: { increment: 2 } });
  assert.equal(args('deleteItems').where.variantId, 'variant');
  assert.deepEqual(args('updateItems').data, { quantity: { decrement: 2 } });
  assert.equal(args('cart').data.status, 'ACTIVE');
  writes.length = 0;
  session.collected_information = null;
  await service.handleCheckoutCompletion({ id: session.id });
  assert.equal(writes.some(([name]) => name === 'address'), false);
  session.payment_status = 'unpaid';
  await assert.rejects(service.handleCheckoutCompletion({ id: session.id }), status(400));
  session.payment_status = 'paid';
  tx.productVariant.updateMany = async () => ({ count: 0 });
  await assert.rejects(service.handleCheckoutCompletion({ id: session.id }), status(409));
});
test('socket authentication and rooms reject unauthenticated and cross-user access', async () => {
  const jwt = require('jsonwebtoken');
  const previousSecret = process.env.ACCESS_TOKEN_SECRET;
  process.env.ACCESS_TOKEN_SECRET = 'unit-test-only-secret';
  let io;
  class FakeServer {
    sockets = { sockets: new Map() };
    constructor() { io = this; }
    use(callback) { this.authenticate = callback; }
    on(event, callback) { if (event === 'connection') this.connect = callback; }
  }
  const { SocketManager } = load('infra/socket/socket', {
    'socket.io': { Server: FakeServer },
    jsonwebtoken: { default: jwt },
    '@/infra/database/database.config': { default: {
      user: { findUnique: async ({ where }) => ({ id: where.id, role: where.id === 'staff' ? 'ADMIN' : 'USER' }) },
      chat: { findUnique: async ({ where }) => ({ userId: where.id === 'own' ? 'owner' : 'other' }) },
    } },
    '../../config/cors': { getAllowedOrigins: () => [] },
  });
  try {
    new SocketManager({});
    const makeSocket = (user) => {
      const handlers = {};
      const rooms = new Set();
      const emitted = [];
      return {
        handshake: { headers: user ? { cookie: 'accessToken=' + jwt.sign({ id: user }, process.env.ACCESS_TOKEN_SECRET) } : {} },
        data: {}, rooms, handlers, emitted,
        on: (event, handler) => { handlers[event] = handler; },
        join: async (room) => { rooms.add(room); },
        to: (room) => ({ emit: (event) => emitted.push([room, event]) }),
      };
    };
    const authenticate = async (socket) => {
      let error;
      await io.authenticate(socket, (err) => { error = err; });
      return error;
    };
    assert.ok(await authenticate(makeSocket()));
    const socket = makeSocket('owner');
    assert.equal(await authenticate(socket), undefined);
    io.connect(socket);
    await socket.handlers.joinChat('other');
    assert.equal(socket.rooms.size, 0);
    socket.handlers.joinAdmin();
    assert.equal(socket.rooms.size, 0);
    await socket.handlers.joinChat('own');
    assert.ok(socket.rooms.has('chat:own'));
    socket.handlers.callOffer({ chatId: 'other', offer: {} });
    socket.handlers.callAnswer({ chatId: 'own', to: 'unrelated' });
    assert.equal(socket.emitted.length, 0);
    socket.handlers.callOffer({ chatId: 'own', offer: {} });
    assert.equal(socket.emitted.length, 1);
    const staff = makeSocket('staff');
    await authenticate(staff);
    io.connect(staff);
    staff.handlers.joinAdmin();
    assert.ok(staff.rooms.has('admin'));
  } finally {
    if (previousSecret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
    else process.env.ACCESS_TOKEN_SECRET = previousSecret;
  }
});
test('cart merge rolls back earlier item writes if a later item is out of stock', async () => {
  let quantity = 1;
  let deleted = false;
  const prisma = {
    $transaction: async (work) => {
      const before = quantity;
      try {
        return await work({
          cartItem: {
            findMany: async () => [
              { variantId: 'a', quantity: 1, variant: { stock: 10 } },
              { variantId: 'b', quantity: 20, variant: { stock: 0 } },
            ],
            findFirst: async () => ({ id: 'existing', quantity }),
            update: async ({ data }) => { quantity = data.quantity; },
          },
          cart: { delete: async () => { deleted = true; } },
        });
      } catch (error) {
        quantity = before;
        throw error;
      }
    },
  };
  const { CartRepository } = load('modules/cart/cart.repository', {
    '@prisma/client': require('@prisma/client'),
    '@/infra/database/database.config': { default: prisma },
  });
  await assert.rejects(new CartRepository().mergeCarts('guest', 'user'), status(400));
  assert.equal(quantity, 1);
  assert.equal(deleted, false);
});


test('checkout validates ownership, quantities, prices and stock before calling Stripe', async () => {
  const calls = [];
  const { CheckoutService } = load('modules/checkout/checkout.service', {
    '@/infra/payment/stripe': { default: { checkout: { sessions: {
      create: async (data) => { calls.push(data); return { id: 'cs_test' }; },
    } } } },
  });
  const service = new CheckoutService();
  const item = { variantId: 'variant', quantity: 2, variant: {
    stock: 3, price: 1499.95, sku: 'GAME', product: { name: 'Игра', images: [] },
  } };
  const cart = { id: 'cart', userId: 'owner', cartItems: [item] };
  await assert.rejects(service.createStripeSession(cart, 'other'), status(403));
  await assert.rejects(service.createStripeSession({ ...cart, cartItems: [] }, 'owner'), status(400));
  for (const quantity of [0, -1, 1.5, NaN, Infinity, '2', 4]) {
    await assert.rejects(service.createStripeSession({ ...cart, cartItems: [{ ...item, quantity }] }, 'owner'), status(400));
  }
  for (const price of [-1, NaN, Infinity, '10', Number.MAX_VALUE]) {
    await assert.rejects(service.createStripeSession({ ...cart, cartItems: [{
      ...item, variant: { ...item.variant, price },
    }] }, 'owner'), status(400));
  }
  assert.equal(calls.length, 0);
  await service.createStripeSession(cart, 'owner');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].line_items[0].price_data.currency, 'kzt');
  assert.equal(calls[0].line_items[0].price_data.unit_amount, 149995);
  assert.deepEqual(calls[0].shipping_address_collection.allowed_countries, ['KZ']);
});

test('product update accepts multipart variants and strips nested database fields', async () => {
  let saved;
  const { ProductController } = load('modules/product/product.controller', {
    '@/shared/utils/asyncHandler': { default: (fn) => fn },
    '@/shared/utils/sendResponse': { default: () => {} },
    '@/shared/utils/slugify': { default: (value) => value },
    '../logs/logs.factory': { makeLogsService: () => ({ info() {} }) },
    '@/shared/utils/uploadToCloudinary': { uploadToCloudinary: async () => { throw new Error('Unexpected upload'); } },
  });
  const controller = new ProductController({ updateProduct: async (id, data) => { saved = data; } });
  const variant = { id: 'v1', sku: 'GAME-1', price: '15001', stock: '24', lowStockThreshold: '0', images: [],
    attributes: [{ id: 'link', variantId: 'v1', attributeId: 'a', valueId: 'b', attribute: { name: 'Brand' } }] };
  const req = { params: { id: 'p1' }, body: { name: 'Игра', isNew: true }, session: { id: 'session' } };
  for (const variants of [JSON.stringify([variant]), [variant]]) {
    req.body.variants = variants;
    await controller.updateProduct(req, {});
    assert.equal(saved.variants[0].price, 15001);
    assert.equal(saved.variants[0].stock, 24);
    assert.equal(saved.variants[0].lowStockThreshold, 0);
    assert.deepEqual(saved.variants[0].attributes, [{ attributeId: 'a', valueId: 'b' }]);
    assert.equal(saved.isNew, true);
    assert.equal(saved.slug, undefined);
  }
  for (const price of ['', 'NaN', 'Infinity', '-1']) {
    req.body.variants = [{ ...variant, price }];
    await assert.rejects(controller.updateProduct(req, {}), status(400));
  }
});

test('product edits retain variant IDs and perform writes only inside the transaction', async () => {
  const writes = [];
  const tx = {
    productVariant: {
      findMany: async () => [{ id: 'v1', sku: 'GAME-1' }],
      update: async (args) => writes.push(['variant', args]),
      create: async () => { throw new Error('Existing variant must not be recreated'); },
    },
    product: { update: async (args) => { writes.push(['product', args]); return args; } },
  };
  const prisma = {
    attribute: { findMany: async () => [] }, attributeValue: { findMany: async () => [] },
    $transaction: async (fn) => fn(tx),
  };
  const { ProductService } = load('modules/product/product.service', {
    '@/infra/database/database.config': { default: prisma },
    '@/shared/utils/ApiFeatures': {}, '@/shared/utils/slugify': { default: (s) => s },
    'csv-parse/sync': {}, xlsx: {},
  });
  const service = new ProductService({ findProductById: async () => ({ name: 'Игра', categoryId: null }) }, {}, {});
  const variant = { id: 'v1', sku: 'GAME-1', price: 15001, stock: 24, lowStockThreshold: 0, attributes: [], images: [] };
  await service.updateProduct('p1', { name: 'Игра', variants: [variant] });
  assert.equal(writes[0][1].where.id, 'v1');
  assert.equal(writes[0][1].data.price, 15001);
  assert.equal(writes[0][1].data.lowStockThreshold, 0);
  assert.equal(writes[1][1].data.slug, undefined);
  await assert.rejects(service.updateProduct('p1', { variants: [{ ...variant, id: 'foreign' }] }), status(400));
});

test('Russian product names produce distinct nonempty slugs', () => {
  const { default: slugify } = load('shared/utils/slugify', { '../errors/AppError': { default: AppError } });
  assert.equal(slugify('  Игровая мышь!  '), 'игровая-мышь');
  assert.notEqual(slugify('Игра первая'), slugify('Игра вторая'));
  assert.equal(slugify('Game Zone 3'), 'game-zone-3');
});

test('user profile changes cannot escalate roles or modify peers', async () => {
  const { UserService } = load('modules/user/user.service');
  let writes = 0;
  const service = new UserService({
    findUserById: async (id) => ({ id, role: id === 'admin' ? 'ADMIN' : 'USER' }),
    updateUser: async () => writes++,
  });
  await assert.rejects(service.updateMe('owner', { role: 'SUPERADMIN' }, 'owner', 'USER'), status(403));
  await assert.rejects(service.updateMe('other', { name: 'Changed' }, 'owner', 'USER'), status(403));
  await assert.rejects(service.updateMe('admin', { name: 'Changed' }, 'admin2', 'ADMIN'), status(403));
  assert.equal(writes, 0);
  await service.updateMe('owner', { name: 'Updated' }, 'owner', 'USER');
  await service.updateMe('owner', { role: 'ADMIN' }, 'superadmin', 'SUPERADMIN');
  assert.equal(writes, 2);
});

test('user listing selects public fields only', async () => {
  let query;
  const { UserRepository } = load('modules/user/user.repository', {
    '@/infra/database/database.config': { default: { user: { findMany: async (args) => { query = args; return []; } } } },
    '@/shared/utils/authUtils': {},
  });
  await new UserRepository().findAllUsers();
  assert.equal(query.select.email, true);
  assert.equal(query.select.password, undefined);
  assert.equal(query.select.resetPasswordToken, undefined);
});

test('cart count sums quantities rather than distinct variants', async () => {
  const service = new CartService({ getCartByUserId: async () => ({ cartItems: [{ quantity: 2 }, { quantity: 3 }] }) });
  assert.equal(await service.getCartCount('owner'), 5);
});
