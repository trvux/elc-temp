-- SEO intent architecture: metadata + service merge (docs/rfc-seo-intent-architecture.md)
-- Run on the production DB as ONE transaction (any unexpected row count aborts everything):
--   ssh vps-elc 'docker exec -i elc-postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB"' < deploy/seo-metadata-2026-10-10.sql
-- Old values were saved to /root/seo-backup-20261010/seo-db-backup-20261010.csv on the VPS (to_jsonb of each row).
-- The nginx timer drops the soft-deleted service from the allowlist within ~2 minutes; the 308
-- thanh-ly -> thu-cu-doi-moi is already installed in nginx's static map.
\set ON_ERROR_STOP on
begin;
do $$
declare n int; surv uuid; old uuid;
begin
  -- group "Máy lạnh": title/description + one-phrase vocabulary fix in the intro (exactly 1 occurrence)
  update group_categories set
    meta_title = 'Máy lạnh (điều hòa) chính hãng Daikin, LG giá rẻ',
    meta_description = 'Máy lạnh (điều hòa, máy điều hòa không khí) Daikin, LG chính hãng tại Điện máy ELC — 130+ mẫu, đủ 5 loại lắp đặt. Giá từ 6,55 triệu, lắp đặt tận nơi, bảo hành chính hãng.',
    content = replace(content::text, 'các dòng máy lạnh (điều hòa không khí) chính hãng', 'các dòng máy lạnh (còn gọi là điều hòa, máy điều hòa không khí) chính hãng')::jsonb
  where slug = 'may-lanh' and deleted_at is null;
  get diagnostics n = row_count; if n <> 1 then raise exception 'may-lanh update affected %', n; end if;

  -- group "Cấp khí tươi thu hồi nhiệt": role = hệ thống/giải pháp (máy + phụ kiện), distinct from the model-list category
  update group_categories set
    meta_title = 'Thông gió cấp khí tươi thu hồi nhiệt Menred',
    meta_description = 'Giải pháp điều hòa thông gió, cấp khí tươi thu hồi nhiệt Menred cho nhà ở, văn phòng, nhà xưởng: máy chính và phụ kiện đồng bộ. Khảo sát, thiết kế, thi công, bảo hành tận nơi.'
  where slug = 'cap-khi-tuoi-thu-hoi-nhiet' and deleted_at is null;
  get diagnostics n = row_count; if n <> 1 then raise exception 'cap-khi update affected %', n; end if;

  -- merge services: survivor = thu-cu-doi-moi, absorb thanh-ly (both were empty template pages)
  select id into surv from services where slug = 'thu-cu-doi-moi-cac-dong-may-lanh' and deleted_at is null;
  select id into old  from services where slug = 'thanh-ly-cac-dong-may-lanh' and deleted_at is null;
  if surv is null or old is null then raise exception 'service ids missing'; end if;
  update services set
    title = 'Thu mua, thanh lý và thu cũ đổi mới máy lạnh',
    meta_title = 'Thu mua máy lạnh cũ giá cao, thanh lý & thu cũ đổi mới',
    meta_description = 'Thu mua máy lạnh cũ giá cao, thanh lý hoặc thu cũ đổi mới khi mua máy mới. Định giá nhanh, tháo dỡ tận nơi, minh bạch, phù hợp mọi nhu cầu.',
    description = 'Thu mua, thanh lý và thu cũ đổi mới các dòng máy lạnh (treo tường, âm trần cassette,...)'
  where id = surv;
  get diagnostics n = row_count; if n <> 1 then raise exception 'survivor update affected %', n; end if;
  update faqs set owner_id = surv, order_index = coalesce(order_index, 0) + 100 where owner_id = old and owner_type = 'service';
  get diagnostics n = row_count; if n < 1 then raise exception 'faq repoint affected %', n; end if;
  update services set deleted_at = now() where id = old;
  get diagnostics n = row_count; if n <> 1 then raise exception 'soft delete affected %', n; end if;
end $$;
commit;
