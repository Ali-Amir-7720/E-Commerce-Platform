INSERT INTO User_roles (Role_name) VALUES
('Admin'),
('Customer'),
('Courier'),
('Vendor');

INSERT INTO Users (Role_id, Full_name, Email, Password, Phone_number)
VALUES
-- Admins
(1, 'Ali Khan', 'ali.khan@admin.com', '$2b$10$k9sd82hJd82kLq1xZ9aPwe', '03000000001'),
(1, 'Ayesha Malik', 'ayesha.malik@admin.com', '$2b$10$Ls9d82jKx82lZm3pQ8wErt', '03000000002'),

-- Vendors
(2, 'Ahmed Raza', 'ahmed.raza@vendor.com', '$2b$10$Qw82kLm9xD82pLs9rTyUi', '03000000003'),
(2, 'Sara Ali', 'sara.ali@vendor.com', '$2b$10$Zx92LmKo82kLp0aSdFgHj', '03000000004'),
(2, 'Usman Tariq', 'usman.tariq@vendor.com', '$2b$10$Pl82mNoPq82lKjH7gFdSa', '03000000005'),
(2, 'Hira Sheikh', 'hira.sheikh@vendor.com', '$2b$10$Rt82LpQwE82mZaXcVbNm1', '03000000006'),
(2, 'Fahad Hussain', 'fahad.hussain@vendor.com', '$2b$10$Yu82IoPqL82kVbNmZxCv2', '03000000007'),

-- Customers
(3, 'Bilal Ahmed', 'bilal.ahmed@gmail.com', '$2b$10$Ab82CdEfG82hIjKlMnOp3', '03000000008'),
(3, 'Fatima Noor', 'fatima.noor@gmail.com', '$2b$10$Gh82IjKlM82nOpQrStUv4', '03000000009'),
(3, 'Zain Ali', 'zain.ali@gmail.com', '$2b$10$Kl82MnOpQ82rStUvWxYz5', '03000000010'),
(3, 'Maham Khan', 'maham.khan@gmail.com', '$2b$10$Qr82StUvW82xYzAbCdEf6', '03000000011'),
(3, 'Hassan Riaz', 'hassan.riaz@gmail.com', '$2b$10$Uv82WxYzA82bCdEfGhIj7', '03000000012'),
(3, 'Areeba Shah', 'areeba.shah@gmail.com', '$2b$10$Wx82YzAbC82dEfGhIjKl8', '03000000013'),
(3, 'Danish Malik', 'danish.malik@gmail.com', '$2b$10$Yz82AbCdE82fGhIjKlMn9', '03000000014'),
(3, 'Noor Fatima', 'noor.fatima@gmail.com', '$2b$10$Za82BcDeF82gHiJkLmNo1', '03000000015'),
(3, 'Saad Qureshi', 'saad.qureshi@gmail.com', '$2b$10$Bc82DeFgH82iJkLmNoPq2', '03000000016'),
(3, 'Laiba Tariq', 'laiba.tariq@gmail.com', '$2b$10$De82FgHiJ82kLmNoPqRs3', '03000000017'),
(3, 'Umar Farooq', 'umar.farooq@gmail.com', '$2b$10$Fg82HiJkL82mNoPqRsTu4', '03000000018'),
(3, 'Iqra Ahmed', 'iqra.ahmed@gmail.com', '$2b$10$Hi82JkLmN82oPqRsTuVw5', '03000000019'),
(3, 'Hamza Khalid', 'hamza.khalid@gmail.com', '$2b$10$Jk82LmNoP82qRsTuVwXy6', '03000000020'),
(3, 'Anaya Siddiqui', 'anaya.siddiqui@gmail.com', '$2b$10$Lm82NoPqR82sTuVwXyZa7', '03000000021'),
(3, 'Taha Yousaf', 'taha.yousaf@gmail.com', '$2b$10$No82PqRsT82uVwXyZaBc8', '03000000022'),
(3, 'Kiran Javed', 'kiran.javed@gmail.com', '$2b$10$Pq82RsTuV82wXyZaBcDe9', '03000000023'),
(3, 'Imran Bashir', 'imran.bashir@gmail.com', '$2b$10$Rs82TuVwX82yZaBcDeFg1', '03000000024'),
(3, 'Sana Rauf', 'sana.rauf@gmail.com', '$2b$10$Tu82VwXyZ82aBcDeFgHi2', '03000000025'),
(3, 'Arham Saleem', 'arham.saleem@gmail.com', '$2b$10$Vw82XyZaB82cDeFgHiJk3', '03000000026'),

-- Couriers
(4, 'Bilal Hussain', 'bilal.hussain@delivery.com', '$2b$10$Xy82ZaBcD82eFgHiJkLm4', '03000000027'),
(4, 'Rashid Mehmood', 'rashid.mehmood@delivery.com', '$2b$10$Za82BcDeF82gHiJkLmNo5', '03000000028'),
(4, 'Kamran Iqbal', 'kamran.iqbal@delivery.com', '$2b$10$Bc82DeFgH82iJkLmNoPq6', '03000000029'),
(4, 'Noman Arif', 'noman.arif@delivery.com', '$2b$10$De82FgHiJ82kLmNoPqRs7', '03000000030');

INSERT INTO Categories (Category_name)
VALUES
('Electronics'),
('Clothing'),
('Books'),
('Home Appliances');

INSERT INTO Products (Category_id, Product_name, Description)
VALUES
(1, 'iPhone 14', 'Latest Apple smartphone'),
(1, 'Samsung Galaxy S23', 'Flagship Android phone'),
(2, 'Men T-Shirt', 'Cotton T-shirt'),
(3, 'Database Systems Book', 'Academic textbook');

INSERT INTO Product_variants (Product_id, Variant_name, SKU, Price, Stock_quantity)
VALUES
(1, '128GB Black', 'IP14-128-BLK', 220000, 50),
(1, '256GB Silver', 'IP14-256-SLV', 250000, 40),
(3, 'Size M Blue', 'TS-M-BLU', 2000, 100),
(3, 'Size L Black', 'TS-L-BLK', 2200, 80),
(4, 'Paperback', 'DB-PB', 5000, 60);

SELECT * FROM Product_variants;
INSERT INTO Shipping_addresses (User_id, Full_address, State, City, Zip_code)
VALUES
(2, 'Street 1 Block A', 'Punjab', 'Lahore', 54000),
(3, 'Street 22 Model Town', 'Punjab', 'Lahore', 54000),
(4, 'Street 10 F-10', 'Islamabad', 'Islamabad', 44000);

INSERT INTO Orders
(User_id, Order_number, Total_amount, Discount_amount, Shipping_amount, Net_amount, Payment_status, Payment_type)
VALUES
(2, 'ORD1001', 220000, 22000, 500, 198500, 'paid', 'upi'),
(3, 'ORD1002', 2000, 200, 200, 2000, 'paid', 'cod');

INSERT INTO Order_items
(Order_id, Product_variant_id, Variant_name, Price, Quantity, Total_amount)
VALUES
(1, 1, '128GB Black', 220000, 1, 220000),
(2, 3, 'Size M Blue', 2000, 1, 2000);

INSERT INTO Wishlist (User_id, Product_variant_id)
VALUES
(2, 2),
(3, 1),
(4, 3);

INSERT INTO Offers
(Coupon_code, Discount_type, Discount_value, Start_date, End_date)
VALUES
('NEWYEAR10', 'rate', 10, '2026-01-01', '2026-01-31'),
('SAVE500', 'fixed', 500, '2026-01-01', '2026-03-01');

INSERT INTO Couriers (User_id, Zip_code, Status)
VALUES
(5, 54000, 'available'),
(6, 44000, 'available');

INSERT INTO Order_deliveries (Order_id, Courier_id, Status)
VALUES
(1, 1, 'assigned'),
(2, 2, 'assigned');

