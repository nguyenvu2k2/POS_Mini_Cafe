-- ============================================================
--  POS Mini Cafe — Database Schema
--  PostgreSQL / MySQL compatible (adjust types as needed)
-- ============================================================

-- ─── ROLES ───────────────────────────────────────────────────
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,   -- 'admin', 'cashier', 'barista'
    description VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── USERS (staff) ───────────────────────────────────────────
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    role_id       INT          NOT NULL REFERENCES roles(id),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── CUSTOMERS ───────────────────────────────────────────────
CREATE TABLE customers (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  UNIQUE,
    email          VARCHAR(150) UNIQUE,
    loyalty_points INT          NOT NULL DEFAULT 0,
    note           TEXT,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,   -- 'Cà phê', 'Trà sữa', 'Bánh ngọt'
    description TEXT,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    category_id INT          NOT NULL REFERENCES categories(id),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── PRODUCT VARIANTS ────────────────────────────────────────
-- Ví dụ: Cà phê sữa → Size S / M / L
CREATE TABLE product_variants (
    id           SERIAL PRIMARY KEY,
    product_id   INT            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name         VARCHAR(100)   NOT NULL,          -- 'Size S', 'Size M', 'Nóng', 'Lạnh'
    price        DECIMAL(12, 0) NOT NULL,
    is_available BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, name)
);

-- ─── PRODUCT IMAGES ──────────────────────────────────────────
CREATE TABLE product_images (
    id         SERIAL PRIMARY KEY,
    product_id INT          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    is_primary BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order INT          NOT NULL DEFAULT 0
);

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE orders (
    id           SERIAL PRIMARY KEY,
    user_id      INT            NOT NULL REFERENCES users(id),      -- nhân viên tạo đơn
    customer_id  INT                     REFERENCES customers(id),  -- khách vãng lai = NULL
    status       VARCHAR(30)    NOT NULL DEFAULT 'pending',
        -- pending → preparing → ready → completed | cancelled
    total_amount DECIMAL(14, 0) NOT NULL DEFAULT 0,
    discount     DECIMAL(14, 0) NOT NULL DEFAULT 0,
    note         TEXT,
    table_no     VARCHAR(20),                                       -- số bàn (nếu có)
    created_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INT            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id INT            NOT NULL REFERENCES product_variants(id),
    quantity   INT            NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(12, 0) NOT NULL,   -- snapshot giá lúc đặt
    subtotal   DECIMAL(14, 0) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    note       TEXT                       -- "ít đá", "nhiều đường"
);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE payments (
    id         SERIAL PRIMARY KEY,
    order_id   INT            NOT NULL REFERENCES orders(id),
    method     VARCHAR(30)    NOT NULL,   -- 'cash', 'card', 'transfer', 'momo', 'vnpay'
    amount     DECIMAL(14, 0) NOT NULL,
    status     VARCHAR(20)    NOT NULL DEFAULT 'pending',
        -- pending | completed | failed | refunded
    reference  VARCHAR(100),             -- mã giao dịch ngoài
    paid_at    TIMESTAMP,
    created_at TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─── INGREDIENTS ─────────────────────────────────────────────
CREATE TABLE ingredients (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(150)   NOT NULL UNIQUE,  -- 'Cà phê robusta', 'Sữa đặc'
    unit           VARCHAR(20)    NOT NULL,          -- 'g', 'ml', 'cái'
    stock_quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
    min_stock      DECIMAL(12, 3) NOT NULL DEFAULT 0,  -- ngưỡng cảnh báo hết hàng
    cost_per_unit  DECIMAL(12, 0),                     -- giá nhập / đơn vị
    is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
    updated_at     TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─── RECIPES ─────────────────────────────────────────────────
-- Mỗi variant cần bao nhiêu nguyên liệu
CREATE TABLE recipes (
    id                SERIAL PRIMARY KEY,
    variant_id        INT            NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    ingredient_id     INT            NOT NULL REFERENCES ingredients(id),
    quantity_required DECIMAL(12, 3) NOT NULL CHECK (quantity_required > 0),
    UNIQUE (variant_id, ingredient_id)
);

-- ─── INVENTORY LOGS ──────────────────────────────────────────
CREATE TABLE inventory_logs (
    id              SERIAL PRIMARY KEY,
    ingredient_id   INT            NOT NULL REFERENCES ingredients(id),
    action_type     VARCHAR(30)    NOT NULL,
        -- 'import' | 'export_sale' | 'export_waste' | 'adjustment'
    quantity_change DECIMAL(12, 3) NOT NULL,   -- dương = nhập, âm = xuất
    note            TEXT,
    user_id         INT                     REFERENCES users(id),  -- ai thực hiện
    order_id        INT                     REFERENCES orders(id), -- liên kết đơn nếu có
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ============================================================
--  INDEXES — tối ưu truy vấn POS
-- ============================================================
CREATE INDEX idx_users_role          ON users(role_id);
CREATE INDEX idx_products_category   ON products(category_id);
CREATE INDEX idx_variants_product    ON product_variants(product_id);
CREATE INDEX idx_images_product      ON product_images(product_id);
CREATE INDEX idx_orders_user         ON orders(user_id);
CREATE INDEX idx_orders_customer     ON orders(customer_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_created      ON orders(created_at DESC);
CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
CREATE INDEX idx_payments_order      ON payments(order_id);
CREATE INDEX idx_recipes_variant     ON recipes(variant_id);
CREATE INDEX idx_recipes_ingredient  ON recipes(ingredient_id);
CREATE INDEX idx_inv_logs_ingredient ON inventory_logs(ingredient_id);
CREATE INDEX idx_inv_logs_created    ON inventory_logs(created_at DESC);

-- ============================================================
--  SEED DATA — dữ liệu mẫu
-- ============================================================

-- Roles
INSERT INTO roles (name, description) VALUES
    ('admin',   'Quản trị viên toàn quyền'),
    ('cashier', 'Thu ngân / tạo đơn'),
    ('barista', 'Pha chế — xem đơn, cập nhật trạng thái');

-- Categories
INSERT INTO categories (name, sort_order) VALUES
    ('Cà phê',   1),
    ('Trà & Trà sữa', 2),
    ('Sinh tố',  3),
    ('Bánh & Snack', 4);

-- Products
INSERT INTO products (category_id, name) VALUES
    (1, 'Cà phê sữa đá'),
    (1, 'Bạc xỉu'),
    (1, 'Cà phê đen'),
    (2, 'Trà sữa trân châu'),
    (2, 'Trà đào cam sả'),
    (3, 'Sinh tố bơ'),
    (4, 'Bánh mì nướng bơ tỏi');

-- Product variants
INSERT INTO product_variants (product_id, name, price) VALUES
    (1, 'Nhỏ',  25000),
    (1, 'Vừa',  30000),
    (1, 'Lớn',  35000),
    (2, 'Nhỏ',  25000),
    (2, 'Lớn',  30000),
    (3, 'Nóng', 20000),
    (3, 'Đá',   22000),
    (4, 'Nhỏ',  35000),
    (4, 'Lớn',  45000),
    (5, 'Ly thường', 30000),
    (6, 'Ly vừa',    40000),
    (7, 'Phần',      20000);

-- Ingredients
INSERT INTO ingredients (name, unit, stock_quantity, min_stock, cost_per_unit) VALUES
    ('Cà phê robusta', 'g',   5000, 500,  250),
    ('Sữa đặc',        'ml', 10000, 1000, 50),
    ('Sữa tươi',       'ml', 20000, 2000, 35),
    ('Đường',          'g',   8000, 500,  15),
    ('Trà xanh',       'g',   3000, 300,  180),
    ('Trân châu đen',  'g',   5000, 500,  120),
    ('Trà đào',        'g',   2000, 200,  200),
    ('Bơ trái',        'g',   4000, 400,  80),
    ('Bánh mì',        'cái',  200,  20,  5000),
    ('Bơ thực vật',    'g',   2000, 200,  100),
    ('Tỏi',            'g',   1000, 100,  50);

-- Recipes — Cà phê sữa đá (Size Vừa = variant_id 2)
INSERT INTO recipes (variant_id, ingredient_id, quantity_required) VALUES
    (2, 1,  18),    -- 18g cà phê
    (2, 2,  40),    -- 40ml sữa đặc
    (2, 4,   5);    -- 5g đường

-- Recipes — Trà sữa trân châu (Size Nhỏ = variant_id 8)
INSERT INTO recipes (variant_id, ingredient_id, quantity_required) VALUES
    (8, 5,  10),    -- 10g trà xanh
    (8, 3, 150),    -- 150ml sữa tươi
    (8, 6,  50),    -- 50g trân châu đen
    (8, 4,  15);    -- 15g đường

-- ============================================================
--  USEFUL VIEWS
-- ============================================================

-- Doanh thu theo ngày
CREATE VIEW v_daily_revenue AS
SELECT
    DATE(o.created_at)  AS sale_date,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(p.amount)        AS total_revenue
FROM orders o
JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
WHERE o.status = 'completed'
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- Top sản phẩm bán chạy
CREATE VIEW v_top_products AS
SELECT
    pr.name          AS product_name,
    pv.name          AS variant_name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.subtotal) AS total_revenue
FROM order_items oi
JOIN product_variants pv ON pv.id = oi.variant_id
JOIN products pr          ON pr.id = pv.product_id
JOIN orders o             ON o.id  = oi.order_id AND o.status = 'completed'
GROUP BY pr.name, pv.name
ORDER BY total_sold DESC;

-- Nguyên liệu sắp hết
CREATE VIEW v_low_stock AS
SELECT
    name,
    unit,
    stock_quantity,
    min_stock,
    (stock_quantity - min_stock) AS buffer
FROM ingredients
WHERE stock_quantity <= min_stock * 1.2
ORDER BY buffer ASC;

