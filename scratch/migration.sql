-- MIGRATION SQL: CONVERT PRODUCT CATEGORIES TO NEW CATEGORIES
BEGIN;

-- 1. Drop existing foreign key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- 2. Update category_id for each product based on old hierarchy mapping
-- Product: "Máy lạnh treo tường Daikin 1HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '47782a9e-2c46-456c-b6f9-2a9c51f22ba1';
-- Product: "Máy lạnh âm trần đa hướng thổi 4HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '9f20d412-3dfc-47b7-a189-0f3a443ce977';
-- Product: "Máy lạnh áp trần DaiKin inverter 5HP ( 3 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = 'b841b9cc-44bf-4b92-a36e-c3d06c6211b8';
-- Product: "Máy lạnh giấu trần nối ống gió 2.5HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '528014bc-341a-464b-ba30-513c28dc5336';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '5ae600d6-56b1-425d-b5b2-1865bd453ce2';
-- Product: "Máy lạnh giấu trần nối ống gió 3HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'a22f3267-9d9a-4a63-aa0a-c637a075b2c5';
-- Product: "Máy lạnh áp trần DaiKin inverter 2HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '92455325-692f-4197-a74d-4e6e85d69faf';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '54ebed8a-e06f-4525-b424-7978ca4020b1';
-- Product: "Máy điều hòa tủ đứng Daikin inverter 4Hp ( 1 pha )" (Old: Máy lạnh -> Điều hòa tủ đứng) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'e398055b-8e31-4c5d-a826-c6c259b71526';
-- Product: "Máy lạnh áp trần DaiKin inverter 3HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '2ec94719-1a61-4440-872e-c4b47b1fc409';
-- Product: "Máy lạnh giấu trần nối ống gió 3HP Daikin ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '9ac01365-e729-4e51-ba99-881feb53e0c2';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '404cb7c7-55c6-4dbb-9802-e75e0aa0d760';
-- Product: "Máy lạnh treo tường Daikin 1HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '90d00b2e-0fb7-4be7-945c-c9e94f709133';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt R150- CLS 4.0E - AQI2000.PM2.5+CO2+RH.S" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '3f722cc2-cbcc-4941-a37f-e929d35834fc';
-- Product: "Máy lạnh LG Inverter 2.5Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '88333046-a2d2-447b-ba22-9e59d8b9286d';
-- Product: "Máy lạnh áp trần DaiKin inverter 4HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = 'f48e0b36-f90c-4456-8635-512cd1a686c0';
-- Product: "Máy lạnh giấu trần nối ống gió 4HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'adc4d3eb-7fa5-415c-84e6-93e758e16a89';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '75c47e42-c39e-4407-9e7f-01ec88daf963';
-- Product: "Máy lạnh áp trần DaiKin inverter 3.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '70ddcc3c-03ea-44bf-a61a-060ff70accfb';
-- Product: "Máy lạnh giấu trần nối ống gió 3HP Daikin ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '63cb97e0-1fc4-4c2b-a11f-d23b9d03474a';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '4b54c65a-8caa-4629-8910-21bce7bf0683';
-- Product: "Máy lạnh âm trần đa hướng thổi 2.5HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'a48a6ca9-18ad-448a-bff4-f3c9f33b9f65';
-- Product: "Module tạo ẩm HUM35" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '9d2c57a6-6deb-4964-89f8-8dfb6b75185c';
-- Product: "Máy lạnh âm trần đa hướng thổi 3.5HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '7bf18423-46e6-4e3f-8d63-14e5f7bac4ba';
-- Product: "Máy lạnh giấu trần nối ống gió 6HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '0bf9f4f1-ca83-45d1-8d72-5a19f26ab5c9';
-- Product: "Máy lọc không khí và cấp khí tươi, khử nồm, thu hồi nhiệt Q6" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'b67a5d0c-7de1-496d-96c9-60c0750444ed';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET 2000" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '7c1a845f-3a73-42ee-bd7d-6d048b7acac3';
-- Product: "Hệ phụ kiện đồng bộ" (Old: Máy lọc không khí -> Phụ kiện đồng bộ của hệ thống cấp gió tươi) => (New Group: Máy lọc không khí -> New Cat: Phụ kiện đồng bộ của hệ thống cấp gió tươi)
UPDATE products SET category_id = '67d41877-a4b9-4427-b568-a0ccba222d5e' WHERE id = '2a4fb2a1-cf48-4592-832a-b989480b3902';
-- Product: "Máy lạnh LG Inverter 1Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '9fac74ab-06d5-4d43-af99-081b1506650c';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt R350- CLS 4.0E - AQI2000.PM2.5+CO2+RH.S" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'd8f91095-ec45-4c19-a3fa-66ca57b0c2de';
-- Product: "Máy lạnh giấu trần nối ống gió 5.5HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'bd6d3430-889f-491a-a94a-f2dc7f98138f';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt G5 bản Full" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '958f1e6b-ffe7-4e42-a3c2-49d64a3fe7b3';
-- Product: "Máy lọc và cấp khi tươi thu hồi nhiệt G7" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'd2edf190-a70b-417c-9db1-eea9bdc5a295';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '903e1ac3-5209-4947-88a7-bb9c58cd58f6';
-- Product: "Máy lạnh âm trần đa hướng thổi 2HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '466a34f8-fbd2-4cda-bfe3-3ed43b76977e';
-- Product: "Máy lạnh treo tường Daikin 2HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '4eb26fbb-e123-4092-ba5f-cd608aa50f90';
-- Product: "Máy lạnh treo tường Daikin 3HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'aeb93b06-fc39-499e-bd3e-9be2983073a3';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt P7- CLS4.0E" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'd496ac46-0120-47b8-9b24-10612009f915';
-- Product: "Máy lạnh treo tường Daikin 2HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '3c17c147-2f75-472e-985f-a3134ac39e32';
-- Product: "Máy lạnh treo tường Daikin 1HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '271c376a-3bbb-4b23-a448-3be823bff051';
-- Product: "Máy lạnh áp trần DaiKin inverter 5.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '01fcd580-c064-4156-83fb-3a7a40f525b7';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'aa884932-f316-4f7f-a474-951072b4a4ec';
-- Product: "Máy lạnh LG Inverter 1.5Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '655996d4-ac20-40b9-a120-88c8aedd3f81';
-- Product: "Máy lạnh âm trần đa hướng thổi 5HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '228011d7-7a77-44d2-aa0f-18e795ae27e9';
-- Product: "Máy lạnh âm trần đa hướng thổi 5.5HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '61f96de0-defb-46b2-b3dd-6404a9a37e99';
-- Product: "Máy lạnh áp trần DaiKin inverter 3HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '3ec51b80-64cb-48d0-8beb-c3e006888ff5';
-- Product: "Máy lạnh treo tường Daikin 3HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '194edc80-d279-4f27-95a9-b71d7050dfa9';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'ff3bf075-ad9b-4527-b9d2-536d27b452af';
-- Product: "Máy lạnh treo tường Daikin 2HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '004ed92a-e923-4065-a892-a1e269e50211';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET.2500" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '10ad3a49-8fdc-404c-951f-db522adf68fe';
-- Product: "Máy lạnh âm trần đa hướng thổi 3HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '70aebf17-04f3-4760-ba5f-f35d4fbdcc1f';
-- Product: "Máy lạnh giấu trần nối ống gió 3.5HP Daikin ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '5863d6bd-ec72-41fa-8bdc-65d65fb62850';
-- Product: "Máy lạnh treo tường Daikin 3HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '0fb4fd84-c483-4ffe-ad50-54d1f489f0b3';
-- Product: "Máy lạnh âm trần đa hướng thổi 5HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '33a57899-04d4-4bde-a030-090d822fd19e';
-- Product: "Máy lạnh giấu trần nối ống gió 6HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '7b4b0338-cd6a-472a-bba3-7836c092631f';
-- Product: "Máy lạnh âm trần đa hướng thổi 4HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '944deab6-4817-4ecb-9fdb-5e41b14b9189';
-- Product: "Máy lạnh âm trần đa hướng thổi 1.5HP  Daikin  ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '6ef30cae-0620-4010-a88c-7da599041967';
-- Product: "Máy cấp khí tươi, lọc không khí Smart O2 S1" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'be9e94df-faba-4b67-979a-c8ae0e2912c1';
-- Product: "Máy lạnh LG Inverter 2.5Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '748acad6-4f19-4efa-bca9-e04f0c1432cc';
-- Product: "Máy lạnh âm trần đa hướng thổi 3HP  Daikin  ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '10dc44eb-bc9e-4889-80e5-ee32976ed468';
-- Product: "Máy lạnh LG Inverter 1Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '09344b97-caa7-4e0b-a151-cdae977e3d3e';
-- Product: "Máy lạnh áp trần DaiKin 4HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '0279ddb4-0f1e-496a-96ac-48efedab8ab4';
-- Product: "Máy lạnh âm trần đa hướng thổi 2HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '8d97ea8b-5e79-41e2-8f61-1a3ac20d7ac8';
-- Product: "Máy lạnh âm trần đa hướng thổi 4.5HP  Daikin  ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'ef954396-e402-46ef-86a9-4f02fb8941a4';
-- Product: "Máy lạnh áp trần DaiKin 2.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '5150cdcf-b19c-49f8-b9c0-d24023f8bd5c';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt P5- CLS4.0E" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'cbfb666d-327c-411d-b8ef-223403ffbdd7';
-- Product: "Máy lạnh âm trần đa hướng thổi 5.5HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'e95c8cdb-75b2-4996-9317-a16337c1dc38';
-- Product: "Máy lạnh âm trần đa hướng thổi 3HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '548cb3c4-f430-44e8-a0b8-01b8fbc4fd07';
-- Product: "Máy điều hòa tủ đứng Daikin inverter 3Hp ( 1 pha )" (Old: Máy lạnh -> Điều hòa tủ đứng) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '22cf4d79-aee3-43fb-8f1a-3f5a05f88ec3';
-- Product: "Máy lạnh âm trần đa hướng thổi 2HP  Daikin  ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'e52eb517-bf39-4b8d-a809-678957b376b1';
-- Product: "Máy lạnh âm trần đa hướng thổi 3.5HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '644c93eb-d51d-4b7f-84cb-3ba4c5732462';
-- Product: "Máy lạnh áp trần DaiKin inverter 2.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '55dd21a2-223f-4f1e-93fc-95eb724c5f53';
-- Product: "Máy lạnh LG Inverter 2Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '9dd37c6d-0100-4d4b-a43f-d42d5c7cc884';
-- Product: "Máy lạnh âm trần đa hướng thổi 2.5HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '895ce36d-9c6b-421e-83ca-d7b3d7e6a388';
-- Product: "Máy lạnh âm trần đa hướng thổi 5.5HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'ee8e84fb-00d1-4550-9cde-9c32aef477f5';
-- Product: "Máy lạnh áp trần DaiKin inverter 1.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = 'e3779222-3005-4f93-a77a-4596f33c8184';
-- Product: "Máy lạnh treo tường Daikin 3HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '6972e92b-acc5-474f-bdf4-d2da8b93dd6b';
-- Product: "Máy lạnh áp trần DaiKin 1.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '16bd5277-ebb0-49eb-806f-f12d0d591343';
-- Product: "Máy lạnh áp trần DaiKin 3.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = 'd86218b6-6d37-4fa5-8626-094052f4c7d9';
-- Product: "Máy lạnh treo tường Daikin 3HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '5aab67ab-0243-491b-a175-2e5f3133ba5a';
-- Product: "Máy lạnh áp trần DaiKin inverter 2.5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '64bf8ef5-4c08-406a-afa0-d0bb18ae9f0b';
-- Product: "Máy lạnh giấu trần nối ống gió 2HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '0bde544e-dd38-432e-9f50-8459a509a6d9';
-- Product: "Máy lạnh treo tường Daikin 1HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'd4bbd752-771c-45f5-a4ad-493f2ee33ac0';
-- Product: "Máy lạnh áp trần DaiKin inverter 4HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '3afc0c09-bd77-4848-b8bb-e8d164efb96d';
-- Product: "Máy lạnh áp trần DaiKin 2HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '4279283c-c7f2-47fa-9dc0-4873736c4606';
-- Product: "Máy lạnh áp trần DaiKin 5HP ( 3 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = 'b86c322f-c662-4cf5-af8e-a24ec56408cc';
-- Product: "Máy lạnh áp trần DaiKin inverter 5HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = 'f02aebfa-1f29-48ee-8508-3cb36acf9c7c';
-- Product: "Máy lạnh âm trần đa hướng thổi 5HP  Daikin  ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'ba040d65-5952-4541-8c61-2a51965170e0';
-- Product: "Máy lạnh âm trần đa hướng thổi 1.5HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '9df48e7c-a87e-47b2-a540-55147736bc6a';
-- Product: "Máy lạnh giấu trần nối ống gió 1.5HP Daikin ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '2e0683c7-5888-4578-b4c0-d32247a73436';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt Smart O2 G3 bản Full" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '1922486a-450a-4b1a-846b-c7c186fbdee3';
-- Product: "Máy lạnh giấu trần nối ống gió 1HP Daikin ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '68bd19c4-33e8-4341-ac16-8d7cbde1d1fc';
-- Product: "Máy lạnh giấu trần nối ống gió 2.5HP Daikin ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '59c07a9b-3810-4aa5-96c9-9dd94e790fa2';
-- Product: "Máy lạnh treo tường Daikin 2HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'e789ddc6-8c1b-41b0-a777-c36c3e591313';
-- Product: "Máy lạnh LG Inverter 2Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '120ca427-0ebc-4c78-b8cc-b692b211077e';
-- Product: "Máy lạnh âm trần đa hướng thổi 4HP  Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'd5afde8f-a0a0-4027-8a24-6b96da396a4b';
-- Product: "Máy lạnh giấu trần nối ống gió 2HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '3485142b-c9f5-4366-b6db-e62579a34ca2';
-- Product: "Máy lạnh treo tường Daikin 1HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'fac6de55-9cc1-431f-b0fd-ff33a4d7c797';
-- Product: "Máy lạnh giấu trần nối ống gió 2.5HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'f6dddc13-af41-4695-b6d6-9e9336e1155f';
-- Product: "Máy điều hòa tủ đứng Daikin inverter 2.5Hp ( 1 pha )" (Old: Máy lạnh -> Điều hòa tủ đứng) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '1d7ec623-9201-4239-b06d-76f9c57fba30';
-- Product: "Máy lạnh treo tường Daikin 1HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '070759ed-8885-445e-93a6-ec09d19c7e17';
-- Product: "MÁY LỌC NƯỚC RO 3 IN 1 MENRED" (Old: Máy lọc nước -> Máy lọc nước RO 3 IN 1 MENRED) => (New Group: Máy lọc nước -> New Cat: Máy lọc nước RO 3 in 1)
UPDATE products SET category_id = 'f31767e2-8837-435a-8143-221f982d01e7' WHERE id = '47915cf7-9e00-45b4-84c3-d328ae7f8025';
-- Product: "Máy lạnh giấu trần nối ống gió 3.5HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '501f9836-7c7e-403f-9bcb-22946bf65596';
-- Product: "Máy lạnh treo tường Daikin 2HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '6e3fb90b-6b02-40bc-b7bb-dfe2562e227d';
-- Product: "Máy lạnh LG Inverter 1.5Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '6617bf93-61f2-4505-b727-f490e5ae1cac';
-- Product: "Máy lạnh âm trần đa hướng thổi 5HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '0a21fe74-bf78-43ac-bf17-49afb3d50984';
-- Product: "Máy lạnh giấu trần nối ống gió 5HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '938a55c3-f749-49f5-af74-e7fd8f91bad1';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '0f36aa18-4ebf-4d27-8f65-88380d6bcdc6';
-- Product: "Máy lạnh áp trần DaiKin inverter 4HP ( 3 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '12cb11fd-6c8e-46c9-b4fc-0d4782cd022e';
-- Product: "Máy lạnh giấu trần nối ống gió 5HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '62b8a5ef-1c1d-4e66-8967-1b3177bcb117';
-- Product: "Máy lạnh treo tường Daikin 1HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'de26d891-b953-485d-bbf4-d1c647b7d2ce';
-- Product: "Máy lạnh treo tường Daikin 1HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '97d306bc-a922-41d0-bae5-2252b9caecb5';
-- Product: "Máy lạnh treo tường Daikin 2HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'bfcdc083-bbf3-49da-9057-b7b2e114c372';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET.800" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'e1e2e16b-e08b-4f8e-b75e-50ecd162a2af';
-- Product: "Máy lạnh treo tường Daikin 3HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'ece09769-3b60-4624-b392-65c8a50ee1a5';
-- Product: "Máy lạnh âm trần đa hướng thổi 2.5HP  Daikin  ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'ee31e0c4-9f52-4b3a-ab06-a9c833c22ed2';
-- Product: "Máy lạnh giấu trần nối ống gió 4HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'ec9a4ed6-2af1-4fa5-9493-94ebb5637f53';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt N5.250A (Ebmpapst)" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'eb286b48-0f2d-467b-9ea9-28d2278097db';
-- Product: "Máy cấp khí tươi, khử nồm HGS-90 PRO" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'd75131fb-2e23-46de-a3f2-c6b399c53c4e';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '8f509711-8eba-4c52-9365-8ee04107a24b';
-- Product: "Ống cấp gió tươi chuyên dụng HPDE 2 lớp kháng khuẩn, kháng nấm" (Old: Máy lọc không khí -> Phụ kiện đồng bộ của hệ thống cấp gió tươi) => (New Group: Máy lọc không khí -> New Cat: Phụ kiện đồng bộ của hệ thống cấp gió tươi)
UPDATE products SET category_id = '67d41877-a4b9-4427-b568-a0ccba222d5e' WHERE id = 'ba2dd113-e130-49df-9d8b-027e9a4260b9';
-- Product: "Máy lạnh treo tường Daikin 1HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'a529a41a-6bbb-4477-8d9a-6a0a0374f259';
-- Product: "Máy lạnh LG Inverter 1.5Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '933a8f06-5932-4d33-a6ef-2719708f656f';
-- Product: "Máy lạnh giấu trần nối ống gió 1.5HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '11e64291-2f5c-482a-83af-71f4e21de833';
-- Product: "Máy lạnh treo tường Daikin 2HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '99ca59ca-cf0e-4f10-b925-26463d4d96ac';
-- Product: "Máy cấp khí tươi, khử nồm G2" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'b3927f18-f2dc-47ca-9078-e2769e35b1cc';
-- Product: "Máy lạnh áp trần DaiKin 4.5HP ( 3 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '4e1a6a79-4c26-4d3f-9ce7-f66c01e69fca';
-- Product: "Máy điều hòa tủ đứng Daikin inverter 5.5Hp ( 1 pha )" (Old: Máy lạnh -> Điều hòa tủ đứng) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '3eb72cec-5b13-4e99-974d-baf9a811bf15';
-- Product: "Máy điều hòa tủ đứng Daikin inverter 2Hp ( 1 pha )" (Old: Máy lạnh -> Điều hòa tủ đứng) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '1d813eef-9120-4cde-a59b-52fc98dc2b32';
-- Product: "Máy lạnh LG Inverter 1Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '7afaaf95-cc23-4512-830d-5d7d6fd3627c';
-- Product: "Máy lạnh giấu trần nối ống gió 3.5HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '6f708546-0e12-446c-9ce5-4ae5e4c70c21';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '3aad3234-688e-4693-b8e8-83b45cd21e32';
-- Product: "Máy điều hòa tủ đứng Daikin inverter 5Hp ( 1 pha )" (Old: Máy lạnh -> Điều hòa tủ đứng) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'a4553604-45e7-4fc1-a94d-d1400d41f655';
-- Product: "Máy lạnh treo tường Daikin 3HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'd3108ad3-508f-44bf-bf4a-a33f85614b4a';
-- Product: "Máy lạnh giấu trần nối ống gió 3.5HP Daikin ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '1d487ed3-d0fb-4b78-93ec-342a7d89249c';
-- Product: "Máy lạnh LG Inverter 1Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '0ca7f475-4a98-4317-ac8f-f0eecfb6dd72';
-- Product: "Cửa gió trong (vent gió) chính hãng" (Old: Máy lọc không khí -> Phụ kiện đồng bộ của hệ thống cấp gió tươi) => (New Group: Máy lọc không khí -> New Cat: Phụ kiện đồng bộ của hệ thống cấp gió tươi)
UPDATE products SET category_id = '67d41877-a4b9-4427-b568-a0ccba222d5e' WHERE id = '368b0c40-6783-4bf6-91ab-a2b9e213ac1d';
-- Product: "Máy lạnh LG Inverter 1.5Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'eb36bf14-c916-431a-9049-d5d367652a9f';
-- Product: "Máy lạnh áp trần DaiKin inverter 5.5HP ( 3 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = 'a5fd9166-ef7d-44ee-a1e9-5467e9cd37e0';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '7f94820e-dc4d-4199-956d-d7bac694000d';
-- Product: "Máy lạnh giấu trần nối ống gió 5HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '2aeaeb34-b939-4e3f-8ba2-8f2099508a2c';
-- Product: "Máy lạnh giấu trần nối ống gió 4HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '5625fb65-2723-49fa-8142-553c34946023';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt N5.150A (Ebmpapst)" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'f955f52b-6c7d-4ea1-8e1b-3dc770f9653d';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '562a056e-820c-403d-ab6c-2c82a44dc86a';
-- Product: "Máy lạnh giấu trần nối ống gió 3HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '1ec73519-aec2-41b9-8dd6-94ba5f64865a';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '4f339755-5728-4558-8170-c06dd6d5d0cd';
-- Product: "Máy lạnh giấu trần nối ống gió 2HP Daikin ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '13f6f7d4-433c-4db3-b36f-2a34967ed5cd';
-- Product: "Máy lạnh LG Inverter 2Hp ( 1 pha )" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '92a218b6-e060-44d1-b246-0db9310ac31d';
-- Product: "Máy lạnh giấu trần nối ống gió 4HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'bb3542fd-f788-4d85-96be-6b6770920088';
-- Product: "Máy lạnh âm trần đa hướng thổi 4HP  Daikin  ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '3ed0497d-cfd4-4d57-9fa8-4411e222cabf';
-- Product: "Máy lạnh áp trần DaiKin 3HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '285823a3-5c81-47ae-be8c-26f72d558c62';
-- Product: "Máy lạnh treo tường Daikin 2HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '7ef53184-31fd-4eca-8ebd-a5ec191e0074';
-- Product: "Máy lọc không khí (cấp khí tươi) NEW5.350" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '40fe11e8-60d4-48a5-8b37-8ecff7728a0b';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '103679fe-7efc-4dad-a077-3be001ddbee6';
-- Product: "Máy lạnh giấu trần nối ống gió 4HP Daikin ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '82e5a304-fb6c-47ae-8497-c539480a5f5b';
-- Product: "Máy lạnh giấu trần nối ống gió 3HP Daikin inverter ( 1 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'c474b377-df01-4051-8aef-dce81fef35d7';
-- Product: "Máy lạnh âm trần đa hướng thổi 3HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '48f6aaf5-9a7e-4290-8e81-b8a93c6835fb';
-- Product: "Máy lạnh giấu trần nối ống gió 3.5HP Daikin ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = 'b19d2490-9505-4e05-843c-de0bae1b1ba0';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'ec6933c6-2b25-4696-8e39-eb5eb1315e85';
-- Product: "Máy lạnh treo tường Daikin 2.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'f16cf22d-894a-48a7-97e9-cdb7389ddca3';
-- Product: "Máy lạnh âm trần đa hướng thổi 3.5HP  Daikin  ( 1 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = '432a6e44-da6d-44fb-8632-23290aaad727';
-- Product: "Máy lạnh âm trần đa hướng thổi 4HP  Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Âm trần đa hướng thổi) => (New Group: Máy lạnh -> New Cat: Máy lạnh âm trần đa hướng thổi)
UPDATE products SET category_id = 'f4d707a9-aef7-41be-ac93-eba8a2f619c5' WHERE id = 'c173e46f-7daf-4edd-bac4-e12e56edfd02';
-- Product: "Máy lạnh áp trần DaiKin inverter 2HP ( 1 pha )" (Old: Máy lạnh -> Áp trần) => (New Group: Máy lạnh -> New Cat: Máy lạnh áp trần)
UPDATE products SET category_id = 'c44f63e6-ecfa-4042-8492-bf86153ce9f8' WHERE id = '8916c15a-c9b4-4173-91d6-c545dd7b3bcd';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET.1000" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '0c78ca2d-a990-45ab-ba8b-cea493a9387f';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET.8000" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '9264d1dc-89e9-4fc6-9cb1-fb6f8ef22ef1';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET 1500" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '9dc00da3-f85e-4df6-a65f-ac1c848124cb';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET.3000" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'cad5695d-53ad-47b3-b10f-f9ebe9f7f305';
-- Product: "Máy lạnh treo tường Daikin 1HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = 'dff6437e-c61e-4dc2-b23b-5a3f436a4e3a';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt R250- CLS 4.0E - AQI2000.PM2.5+CO2+RH.S" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'b7006080-01cc-4752-ba45-3970acdeb565';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - hai chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '88321398-4c39-456b-adc6-1d79dd51bb7c';
-- Product: "Máy lạnh treo tường Daikin 2HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '1122a2d8-0cb5-46fb-8d1b-ae0e68a948fc';
-- Product: "Máy lạnh giấu trần nối ống gió 3HP Daikin inverter ( 3 pha )" (Old: Máy lạnh -> Giấu trần nối ống gió) => (New Group: Máy lạnh -> New Cat: Máy lạnh giấu trần nối ống gió)
UPDATE products SET category_id = '190ca17f-e554-4633-8ad0-576f8c3cf96f' WHERE id = '9f053214-4a6b-43b5-8356-45d2362693c7';
-- Product: "Máy lạnh treo tường Daikin 1.5HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '142b859d-69b7-4629-b2e9-c92acba4e8fc';
-- Product: "Máy lạnh treo tường Daikin 2HP - một chiều Inverter" (Old: Máy lạnh -> Treo tường) => (New Group: Máy lạnh -> New Cat: Máy lạnh treo tường)
UPDATE products SET category_id = 'db74c68a-3e74-4cb8-8ed9-8ab439876df5' WHERE id = '4be1099e-dfe6-4313-9814-764773a137b6';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt S5- CLS4.0E" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = '3f788513-b9bb-44bd-aea7-7761651f59bf';
-- Product: "Máy lọc và cấp khí tươi thu hồi nhiệt NET.5000" (Old: Máy lọc không khí -> Máy cấp khí tươi, lọc không khí) => (New Group: Máy lọc không khí -> New Cat: Máy cấp khí tươi, lọc không khí)
UPDATE products SET category_id = 'a4393b65-f1c1-418f-ba37-6220acbf8226' WHERE id = 'db8f9514-53ef-426c-9f97-89793c9fc450';

-- 3. Re-create foreign key constraint pointing to the new category table
ALTER TABLE products 
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES category(id) 
ON DELETE RESTRICT;

COMMIT;