-- Loads the CSVs mounted read-only at /seed.
--
-- The source files spell nulls as the literal text "NULL", so each nullable
-- column goes through nullIf. Picture and photo columns in the originals hold
-- hex-encoded bitmaps and are dropped: they are noise for querying.

INSERT INTO northwind.categories
SELECT categoryID, categoryName, description
FROM file('categories.csv', CSVWithNames,
          'categoryID UInt16, categoryName String, description String, picture String');

INSERT INTO northwind.suppliers
SELECT supplierID, companyName, contactName, city, country
FROM file('suppliers.csv', CSVWithNames,
          'supplierID UInt16, companyName String, contactName String, contactTitle String,
           address String, city String, region String, postalCode String, country String,
           phone String, fax String, homePage String');

INSERT INTO northwind.products
SELECT productID, productName, supplierID, categoryID, quantityPerUnit, unitPrice,
       unitsInStock, unitsOnOrder, reorderLevel, discontinued
FROM file('products.csv', CSVWithNames,
          'productID UInt16, productName String, supplierID UInt16, categoryID UInt16,
           quantityPerUnit String, unitPrice Decimal(10,2), unitsInStock Int16,
           unitsOnOrder Int16, reorderLevel Int16, discontinued UInt8');

INSERT INTO northwind.customers
SELECT customerID, companyName, contactName, contactTitle, city,
       nullIf(region, 'NULL'), postalCode, country, phone
FROM file('customers.csv', CSVWithNames,
          'customerID String, companyName String, contactName String, contactTitle String,
           address String, city String, region String, postalCode String, country String,
           phone String, fax String');

INSERT INTO northwind.employees
SELECT employeeID, lastName, firstName, title,
       toDate(parseDateTimeBestEffortOrNull(nullIf(birthDate, 'NULL'))),
       toDate(parseDateTimeBestEffortOrNull(nullIf(hireDate, 'NULL'))),
       city, country,
       toUInt16OrNull(nullIf(reportsTo, 'NULL'))
FROM file('employees.csv', CSVWithNames,
          'employeeID UInt16, lastName String, firstName String, title String,
           titleOfCourtesy String, birthDate String, hireDate String, address String,
           city String, region String, postalCode String, country String, homePhone String,
           extension String, photo String, notes String, reportsTo String, photoPath String');

INSERT INTO northwind.shippers
SELECT shipperID, companyName, phone
FROM file('shippers.csv', CSVWithNames,
          'shipperID UInt16, companyName String, phone String');

INSERT INTO northwind.orders
SELECT orderID, customerID, employeeID,
       parseDateTimeBestEffortOrNull(nullIf(orderDate, 'NULL')),
       parseDateTimeBestEffortOrNull(nullIf(requiredDate, 'NULL')),
       parseDateTimeBestEffortOrNull(nullIf(shippedDate, 'NULL')),
       shipVia, freight, shipName, shipCity, nullIf(shipRegion, 'NULL'), shipCountry
FROM file('orders.csv', CSVWithNames,
          'orderID UInt32, customerID String, employeeID UInt16, orderDate String,
           requiredDate String, shippedDate String, shipVia UInt8, freight Decimal(10,2),
           shipName String, shipAddress String, shipCity String, shipRegion String,
           shipPostalCode String, shipCountry String');

INSERT INTO northwind.order_details
SELECT orderID, productID, unitPrice, quantity, discount
FROM file('order_details.csv', CSVWithNames,
          'orderID UInt32, productID UInt16, unitPrice Decimal(10,2), quantity UInt16,
           discount Float32');
