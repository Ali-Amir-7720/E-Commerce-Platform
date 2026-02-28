EXPLAIN ANALYZE
SELECT *
FROM Users
WHERE Email = 'zain.ali@gmail.com';
CREATE INDEX idx_users_email
ON Users (Email);
EXPLAIN ANALYZE
SELECT *
FROM Users
WHERE Email = 'zain.ali@gmail.com';
EXPLAIN ANALYZE
SELECT *
FROM Orders
WHERE User_id = 15;
CREATE INDEX idx_orders_user
ON Orders (User_id);
EXPLAIN ANALYZE
SELECT *
FROM Orders
WHERE User_id = 15;
EXPLAIN ANALYZE
SELECT *
FROM Products
WHERE Category_id = 3;
CREATE INDEX idx_products_category
ON Products (Category_id);
EXPLAIN ANALYZE
SELECT *
FROM Products
WHERE Category_id = 3;
EXPLAIN ANALYZE
SELECT oi.*, pv.Price
FROM Order_items oi
JOIN Product_variants pv ON oi.Product_variant_id = pv.Id
WHERE oi.Order_id = 5;
CREATE INDEX idx_orderitems_order
ON Order_items (Order_id);
EXPLAIN ANALYZE
SELECT oi.*, pv.Price
FROM Order_items oi
JOIN Product_variants pv ON oi.Product_variant_id = pv.Id
WHERE oi.Order_id = 5;
EXPLAIN ANALYZE
SELECT *
FROM Order_deliveries
WHERE Courier_id = 27;
CREATE INDEX idx_deliveries_courier
ON Order_deliveries (Courier_id);
EXPLAIN ANALYZE
SELECT *
FROM Order_deliveries
WHERE Courier_id = 27;
EXPLAIN ANALYZE
SELECT *
FROM Product_variants
WHERE Price BETWEEN 1000 AND 5000;
CREATE INDEX idx_variants_price
ON Product_variants (Price);
EXPLAIN ANALYZE
SELECT *
FROM Product_variants
WHERE Price BETWEEN 1000 AND 5000;