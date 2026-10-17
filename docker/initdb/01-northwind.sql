-- Northwind: the classic sales dataset, loaded on first container start.
-- Source CSVs are mounted read-only at /var/lib/clickhouse/user_files/seed.
--
-- Column comments are deliberate: the assistant's schema search reads them,
-- so they carry the meaning a column name alone does not.

CREATE DATABASE IF NOT EXISTS northwind;

CREATE TABLE IF NOT EXISTS northwind.categories
(
    category_id   UInt16 COMMENT 'Primary key',
    category_name String COMMENT 'Beverages, Condiments, Dairy Products, …',
    description   String
)
ENGINE = MergeTree ORDER BY category_id
COMMENT 'Product categories';

CREATE TABLE IF NOT EXISTS northwind.suppliers
(
    supplier_id   UInt16 COMMENT 'Primary key; products.supplier_id references this',
    company_name  String,
    contact_name  String,
    city          String,
    country       String
)
ENGINE = MergeTree ORDER BY supplier_id
COMMENT 'Companies that supply the products';

CREATE TABLE IF NOT EXISTS northwind.products
(
    product_id       UInt16 COMMENT 'Primary key; order_details.product_id references this',
    product_name     String,
    supplier_id      UInt16 COMMENT 'References suppliers.supplier_id',
    category_id      UInt16 COMMENT 'References categories.category_id',
    quantity_per_unit String COMMENT 'Packaging description, e.g. "10 boxes x 20 bags"',
    unit_price       Decimal(10, 2) COMMENT 'Current list price; orders record their own price',
    units_in_stock   Int16,
    units_on_order   Int16,
    reorder_level    Int16,
    discontinued     UInt8 COMMENT '1 when the product is no longer sold'
)
ENGINE = MergeTree ORDER BY product_id
COMMENT 'Catalogue of products';

CREATE TABLE IF NOT EXISTS northwind.customers
(
    customer_id   String COMMENT 'Five-letter code, e.g. VINET; orders.customer_id references this',
    company_name  String,
    contact_name  String,
    contact_title String,
    city          String,
    region        Nullable(String),
    postal_code   String,
    country       String,
    phone         String
)
ENGINE = MergeTree ORDER BY customer_id
COMMENT 'Companies that place orders';

CREATE TABLE IF NOT EXISTS northwind.employees
(
    employee_id UInt16 COMMENT 'Primary key; orders.employee_id references this',
    last_name   String,
    first_name  String,
    title       String COMMENT 'Job title, e.g. Sales Representative',
    birth_date  Nullable(Date),
    hire_date   Nullable(Date),
    city        String,
    country     String,
    reports_to  Nullable(UInt16) COMMENT 'Manager, references employees.employee_id'
)
ENGINE = MergeTree ORDER BY employee_id
COMMENT 'Sales staff who take the orders';

CREATE TABLE IF NOT EXISTS northwind.shippers
(
    shipper_id   UInt16 COMMENT 'Primary key; orders.ship_via references this',
    company_name String,
    phone        String
)
ENGINE = MergeTree ORDER BY shipper_id
COMMENT 'Carriers used to ship orders';

CREATE TABLE IF NOT EXISTS northwind.orders
(
    order_id      UInt32 COMMENT 'Primary key; order_details.order_id references this',
    customer_id   String COMMENT 'References customers.customer_id',
    employee_id   UInt16 COMMENT 'References employees.employee_id',
    order_date    Nullable(DateTime) COMMENT 'When the order was placed; data covers 1996-1998',
    required_date Nullable(DateTime),
    shipped_date  Nullable(DateTime) COMMENT 'Null while the order is unshipped',
    ship_via      UInt8 COMMENT 'References shippers.shipper_id',
    freight       Decimal(10, 2) COMMENT 'Shipping cost charged on the order',
    ship_name     String,
    ship_city     String,
    ship_region   Nullable(String),
    ship_country  String
)
ENGINE = MergeTree ORDER BY order_id
COMMENT 'Order headers, one row per order';

CREATE TABLE IF NOT EXISTS northwind.order_details
(
    order_id   UInt32 COMMENT 'References orders.order_id',
    product_id UInt16 COMMENT 'References products.product_id',
    unit_price Decimal(10, 2) COMMENT 'Price at the time of the order',
    quantity   UInt16,
    discount   Float32 COMMENT 'Fraction off, 0 to 0.25. Revenue = unit_price * quantity * (1 - discount)'
)
ENGINE = MergeTree ORDER BY (order_id, product_id)
COMMENT 'Order lines, one row per product on an order';
