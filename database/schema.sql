
-- ── Roles ─────────────────────────────────────────────────────────────────────
CREATE TABLE User_roles (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Role_name VARCHAR(50) NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL
);

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE Users (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Role_id INT NOT NULL,
    Full_name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Phone_number VARCHAR(20),
    Status VARCHAR(20) DEFAULT 'active' CHECK (Status IN ('active', 'inactive', 'blocked')),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (Role_id) REFERENCES User_roles(Id)
);

-- ── Categories ────────────────────────────────────────────────────────────────
CREATE TABLE Categories (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Category_name VARCHAR(100) NOT NULL,
    Parent_cat_id INT NULL,
    Status VARCHAR(20) DEFAULT 'active' CHECK (Status IN ('active', 'inactive')),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (Parent_cat_id) REFERENCES Categories(Id)
);

-- ── Products (extended with vendor_id, image_url, banned status) ──────────────
CREATE TABLE Products (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Category_id INT NOT NULL,
    Vendor_id INT NULL,
    Product_name VARCHAR(150) NOT NULL,
    Description TEXT,
    Image_url TEXT,
    Status VARCHAR(20) DEFAULT 'active' CHECK (Status IN ('active', 'inactive', 'banned')),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (Category_id) REFERENCES Categories(Id),
    FOREIGN KEY (Vendor_id) REFERENCES Users(Id)
);

-- ── Product Variants ──────────────────────────────────────────────────────────
CREATE TABLE Product_variants (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Product_id INT NOT NULL,
    Variant_name VARCHAR(100),
    SKU VARCHAR(100) UNIQUE,
    Price DECIMAL(10,2) NOT NULL,
    Stock_quantity INT NOT NULL DEFAULT 0,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (Product_id) REFERENCES Products(Id)
);

-- ── Carts (one per user enforced) ─────────────────────────────────────────────
CREATE TABLE Carts (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    User_id INT NOT NULL UNIQUE,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (User_id) REFERENCES Users(Id)
);

-- ── Cart Items ────────────────────────────────────────────────────────────────
CREATE TABLE Cart_items (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Cart_id INT NOT NULL,
    Product_variant_id INT NOT NULL,
    Quantity INT NOT NULL DEFAULT 1,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (Cart_id) REFERENCES Carts(Id),
    FOREIGN KEY (Product_variant_id) REFERENCES Product_variants(Id)
);

-- ── Shipping Addresses ────────────────────────────────────────────────────────
CREATE TABLE Shipping_addresses (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    User_id INT NOT NULL,
    Full_address TEXT NOT NULL,
    State VARCHAR(50) NOT NULL,
    City VARCHAR(50) NOT NULL,
    Zip_code VARCHAR(20) NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (User_id) REFERENCES Users(Id)
);

-- ── Orders (extended statuses) ────────────────────────────────────────────────
CREATE TABLE Orders (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    User_id INT NOT NULL,
    Order_number VARCHAR(50) UNIQUE NOT NULL,
    Total_amount DECIMAL(10,2) NOT NULL,
    Discount_amount DECIMAL(10,2) DEFAULT 0,
    Shipping_amount DECIMAL(10,2) DEFAULT 0,
    Net_amount DECIMAL(10,2) NOT NULL,
    Status VARCHAR(20) DEFAULT 'placed' CHECK (Status IN (
        'placed', 'processing', 'shipping', 'delivered',
        'cancelled', 'failed', 'flagged'
    )),
    Payment_status VARCHAR(20) DEFAULT 'not paid' CHECK (Payment_status IN ('paid', 'not paid')),
    Payment_type VARCHAR(20) CHECK (Payment_type IN ('netbanking', 'upi', 'cod')),
    Payment_transaction_id VARCHAR(100),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (User_id) REFERENCES Users(Id)
);

-- ── Order Items (price snapshot) ──────────────────────────────────────────────
CREATE TABLE Order_items (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Order_id INT NOT NULL,
    Product_variant_id INT NOT NULL,
    Variant_name VARCHAR(100),
    Price DECIMAL(10,2) NOT NULL,
    Quantity INT NOT NULL,
    Total_amount DECIMAL(10,2) NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (Order_id) REFERENCES Orders(Id),
    FOREIGN KEY (Product_variant_id) REFERENCES Product_variants(Id)
);

-- ── Wishlist (no duplicates) ──────────────────────────────────────────────────
CREATE TABLE Wishlist (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    User_id INT NOT NULL,
    Product_variant_id INT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(User_id, Product_variant_id),
    FOREIGN KEY (User_id) REFERENCES Users(Id),
    FOREIGN KEY (Product_variant_id) REFERENCES Product_variants(Id)
);

-- ── Offers / Coupons ──────────────────────────────────────────────────────────
CREATE TABLE Offers (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Coupon_code VARCHAR(50) UNIQUE NOT NULL,
    Discount_type VARCHAR(20) NOT NULL CHECK (Discount_type IN ('fixed', 'rate')),
    Discount_value DECIMAL(10,2) NOT NULL,
    Start_date DATE NOT NULL,
    End_date DATE NOT NULL,
    Status VARCHAR(20) DEFAULT 'active' CHECK (Status IN ('active', 'inactive')),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL
);

-- ── Couriers ──────────────────────────────────────────────────────────────────
CREATE TABLE Couriers (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    User_id INT NOT NULL,
    Zip_code INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'available' CHECK (Status IN ('available', 'busy', 'inactive')),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_at TIMESTAMP NULL,
    FOREIGN KEY (User_id) REFERENCES Users(Id)
);

-- ── Order Deliveries (extended with failed_at, fail_reason) ───────────────────
CREATE TABLE Order_deliveries (
    Id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    Order_id INT NOT NULL,
    Courier_id INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'assigned' CHECK (Status IN ('assigned', 'picked', 'delivered', 'failed')),
    Assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Picked_at TIMESTAMP NULL,
    Delivered_at TIMESTAMP NULL,
    Failed_at TIMESTAMP NULL,
    Fail_reason TEXT,
    FOREIGN KEY (Order_id) REFERENCES Orders(Id)
    -- Note: courier_id FK to Couriers intentionally removed
    -- courier_id stores Users.id directly in this implementation
);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES Products(id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, order_id)
);

-- ── Fraud Flags ───────────────────────────────────────────────────────────────
CREATE TABLE fraud_flags (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES Orders(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    rule_triggered VARCHAR(50) NOT NULL,
    detail TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INT REFERENCES Users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Messages (real-time chat) ─────────────────────────────────────────────────
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('product', 'order')),
    room_id INT NOT NULL,
    sender_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═════════════════════════════════════════════════════════════
-- CONSTRAINTS
-- ═════════════════════════════════════════════════════════════
ALTER TABLE Product_variants ADD CONSTRAINT chk_price_positive CHECK (Price >= 0);
ALTER TABLE Product_variants ADD CONSTRAINT chk_stock_positive CHECK (Stock_quantity >= 0);
ALTER TABLE Orders ADD CONSTRAINT chk_total_amount_positive CHECK (Total_amount >= 0);
ALTER TABLE Orders ADD CONSTRAINT chk_discount_positive CHECK (Discount_amount >= 0);
ALTER TABLE Orders ADD CONSTRAINT chk_net_amount_positive CHECK (Net_amount >= 0);
ALTER TABLE Cart_items ADD CONSTRAINT chk_quantity_positive CHECK (Quantity > 0);

-- ═════════════════════════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════════════════════════
CREATE INDEX idx_users_email       ON Users(Email);
CREATE INDEX idx_orders_user       ON Orders(User_id);
CREATE INDEX idx_variants_product  ON Product_variants(Product_id);
CREATE INDEX idx_order_items_order ON Order_items(Order_id);
CREATE INDEX idx_cart_user         ON Carts(User_id);
CREATE INDEX idx_wishlist_user     ON Wishlist(User_id);
CREATE INDEX idx_courier_zip       ON Couriers(Zip_code);
CREATE INDEX idx_messages_room     ON messages(room_type, room_id);

-- ═════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═════════════════════════════════════════════════════════════

-- Trigger 1: Reduce stock after order item inserted
DROP TRIGGER IF EXISTS trg_reduce_stock ON Order_items;
CREATE OR REPLACE FUNCTION reduce_stock_after_order()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE current_stock INT;
BEGIN
    SELECT Stock_quantity INTO current_stock
    FROM Product_variants WHERE Id = NEW.Product_variant_id;
    IF current_stock >= NEW.Quantity THEN
        UPDATE Product_variants
        SET Stock_quantity = Stock_quantity - NEW.Quantity
        WHERE Id = NEW.Product_variant_id;
    ELSE
        RAISE EXCEPTION 'Insufficient stock available';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_reduce_stock
AFTER INSERT ON Order_items
FOR EACH ROW EXECUTE FUNCTION reduce_stock_after_order();

-- Trigger 2: Auto-update order status when delivery is marked delivered
CREATE OR REPLACE FUNCTION auto_update_order_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Status = 'delivered' THEN
        UPDATE Orders
        SET Status = 'delivered', Updated_at = CURRENT_TIMESTAMP
        WHERE Id = NEW.Order_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_order_delivery_status
AFTER UPDATE ON Order_deliveries
FOR EACH ROW EXECUTE FUNCTION auto_update_order_status();

-- Trigger 3: Auto-update Users.Updated_at on any update
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.Updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON Users
FOR EACH ROW EXECUTE FUNCTION update_users_timestamp();

-- VIEWS

-- View 1: Customer order summary
CREATE VIEW Customer_Order_Summary AS
SELECT u.Full_name,
       o.Id AS Order_id,
       o.Net_amount,
       o.Status
FROM Users u
JOIN Orders o ON u.Id = o.User_id;

-- View 2: Product sales report
CREATE VIEW Product_Sales_Report AS
SELECT p.Product_name,
       SUM(oi.Quantity) AS Total_Sold,
       SUM(oi.Total_amount) AS Total_Revenue
FROM Products p
JOIN Product_variants pv ON p.Id = pv.Product_id
JOIN Order_items oi ON pv.Id = oi.Product_variant_id
GROUP BY p.Product_name;
CREATE VIEW Courier_Active_Deliveries AS
SELECT c.Id AS Courier_id,
       o.Id AS Order_id,
       od.Status
FROM Couriers c
JOIN Order_deliveries od ON c.Id = od.Courier_id
JOIN Orders o ON od.Order_id = o.Id
WHERE od.Status = 'assigned';

INSERT INTO User_roles (Role_name) VALUES
    ('Admin'),
    ('Customer'),
    ('Courier'),
    ('Vendor');