-- ============================================================
-- KINGFLOOR DEMO DATA SEED SCRIPT
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER kingfloor-schema.sql.
-- Populates one full demo building (8 units, fees history,
-- announcements, a poll with votes, and maintenance issues) for
-- a specific test account, so you don't have to click through
-- the whole onboarding flow by hand before demoing.
--
-- 1. Sign up that test account in the app first (auth.users must
--    already have it — this script does not create accounts).
-- 2. Edit v_admin_email below to that account's email.
-- 3. (Optional) Edit v_resident_email to a SECOND already-signed-up
--    account to drop straight into being a resident of unit 1 —
--    skip this (leave it NULL) if you'd rather test the real
--    invite-code join flow yourself with that second account.
-- 4. Run the whole script once. Re-running is a no-op if the
--    admin email already belongs to a building (see the guard
--    below) — use the cleanup block at the bottom to start over.
-- ============================================================

DO $$
DECLARE
    v_admin_email    TEXT := 'YOUR_EMAIL_HERE@example.com'; -- ✏️ EDIT ME
    v_resident_email TEXT := NULL;                           -- ✏️ optional, e.g. 'resident@example.com'

    v_admin_id    UUID;
    v_resident_id UUID;
    v_building_id UUID;
    v_unit_ids    UUID[] := ARRAY[]::UUID[];
    v_unit_id     UUID;
    v_fee_id      UUID;
    v_poll_id     UUID;
    v_opt_yes     UUID;
    v_opt_no      UUID;
    v_opt_abstain UUID;
    v_issue_id    UUID;
    v_period_prev TEXT := to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM');
    v_period_cur  TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
    v_invite_code TEXT;
    i             INT;
BEGIN
    -- ── Resolve accounts ────────────────────────────────────────────────
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'No account found for % — sign up in the app first, then re-run this script.', v_admin_email;
    END IF;

    IF EXISTS (SELECT 1 FROM public.building_members WHERE user_id = v_admin_id) THEN
        RAISE NOTICE '% already belongs to a building — skipping (see the cleanup block at the bottom to reset).', v_admin_email;
        RETURN;
    END IF;

    IF v_resident_email IS NOT NULL THEN
        SELECT id INTO v_resident_id FROM auth.users WHERE email = v_resident_email;
        IF v_resident_id IS NULL THEN
            RAISE EXCEPTION 'No account found for % — sign up that second account first, or set v_resident_email to NULL.', v_resident_email;
        END IF;
        IF EXISTS (SELECT 1 FROM public.building_members WHERE user_id = v_resident_id) THEN
            RAISE EXCEPTION '% already belongs to a building — pick a different resident email or unassign them first.', v_resident_email;
        END IF;
    END IF;

    -- ── Building (the INSERT trigger auto-promotes v_admin_id to admin) ─
    INSERT INTO public.buildings (name, address, created_by)
    VALUES ('Бл. 47, ж.к. Дружба 2', 'ул. Свети Наум 12, София', v_admin_id)
    RETURNING id, invite_code INTO v_building_id, v_invite_code;

    -- ── Units: 8 apartments, 2 per floor, varied area ───────────────────
    FOR i IN 1..8 LOOP
        INSERT INTO public.units (building_id, number, floor, area_sqm)
        VALUES (v_building_id, i::text, ceil(i / 2.0), 58 + i * 5)
        RETURNING id INTO v_unit_id;
        v_unit_ids := array_append(v_unit_ids, v_unit_id);
    END LOOP;

    -- Drop the optional second test account straight into unit 1.
    IF v_resident_id IS NOT NULL THEN
        INSERT INTO public.building_members (building_id, user_id, role, unit_id)
        VALUES (v_building_id, v_resident_id, 'resident', v_unit_ids[1]);
    END IF;

    -- ── Fees: last month all settled, this month a mix of statuses ─────
    FOR i IN 1..array_length(v_unit_ids, 1) LOOP
        INSERT INTO public.fees (building_id, unit_id, period, amount, due_date, status, paid_at)
        VALUES (v_building_id, v_unit_ids[i], v_period_prev, 45.00, (CURRENT_DATE - INTERVAL '1 month')::date, 'paid', NOW() - INTERVAL '20 days')
        RETURNING id INTO v_fee_id;
        INSERT INTO public.payments (fee_id, unit_id, amount, method, recorded_by, paid_at)
        VALUES (v_fee_id, v_unit_ids[i], 45.00, 'cash', v_admin_id, NOW() - INTERVAL '20 days');

        IF i % 3 = 0 THEN
            -- overdue: due date already passed, still unpaid
            INSERT INTO public.fees (building_id, unit_id, period, amount, due_date, status)
            VALUES (v_building_id, v_unit_ids[i], v_period_cur, 45.00, (CURRENT_DATE - INTERVAL '5 days')::date, 'overdue');
        ELSIF i % 2 = 0 THEN
            -- paid already this month too
            INSERT INTO public.fees (building_id, unit_id, period, amount, due_date, status, paid_at)
            VALUES (v_building_id, v_unit_ids[i], v_period_cur, 45.00, (CURRENT_DATE + INTERVAL '10 days')::date, 'paid', NOW() - INTERVAL '2 days')
            RETURNING id INTO v_fee_id;
            INSERT INTO public.payments (fee_id, unit_id, amount, method, recorded_by, paid_at)
            VALUES (v_fee_id, v_unit_ids[i], 45.00, 'bank_transfer', v_admin_id, NOW() - INTERVAL '2 days');
        ELSE
            -- still unpaid, not yet due
            INSERT INTO public.fees (building_id, unit_id, period, amount, due_date, status)
            VALUES (v_building_id, v_unit_ids[i], v_period_cur, 45.00, (CURRENT_DATE + INTERVAL '10 days')::date, 'unpaid');
        END IF;
    END LOOP;

    -- ── Announcements ────────────────────────────────────────────────────
    INSERT INTO public.announcements (building_id, author_id, title, body, pinned, created_at) VALUES
        (v_building_id, v_admin_id, 'Годишно общо събрание', 'Каним всички собственици на общо събрание на 15-то число от месеца в 18:30 ч. във входа.', true, NOW() - INTERVAL '2 days'),
        (v_building_id, v_admin_id, 'Почистване на двора', 'Фирмата за почистване ще обработи двора и общите части тази събота сутрин.', false, NOW() - INTERVAL '5 days'),
        (v_building_id, v_admin_id, 'Нов график за извозване на отпадъци', 'От следващата седмица извозването е всеки вторник и петък вместо само в петък.', false, NOW() - INTERVAL '9 days');

    -- ── Poll: open vote with a few cast ballots ─────────────────────────
    INSERT INTO public.polls (building_id, created_by, title, description, status)
    VALUES (v_building_id, v_admin_id, 'Ремонт на асансьора', 'Основен ремонт на асансьора, прогнозна цена 1636 €, разпределена по идеални части.', 'open')
    RETURNING id INTO v_poll_id;

    INSERT INTO public.poll_options (poll_id, label, position) VALUES (v_poll_id, 'Да', 0) RETURNING id INTO v_opt_yes;
    INSERT INTO public.poll_options (poll_id, label, position) VALUES (v_poll_id, 'Не', 1) RETURNING id INTO v_opt_no;
    INSERT INTO public.poll_options (poll_id, label, position) VALUES (v_poll_id, 'Без мнение', 2) RETURNING id INTO v_opt_abstain;

    -- NOTE: poll_votes.user_id has no real per-resident accounts to attach
    -- to here, so every seeded ballot is recorded under the admin account —
    -- harmless for demo purposes since the UI only ever displays vote
    -- counts per option, never "who voted".
    INSERT INTO public.poll_votes (poll_id, option_id, unit_id, user_id) VALUES
        (v_poll_id, v_opt_yes, v_unit_ids[1], v_admin_id),
        (v_poll_id, v_opt_yes, v_unit_ids[2], v_admin_id),
        (v_poll_id, v_opt_yes, v_unit_ids[3], v_admin_id),
        (v_poll_id, v_opt_no, v_unit_ids[5], v_admin_id),
        (v_poll_id, v_opt_abstain, v_unit_ids[6], v_admin_id);

    -- ── Expenses: spread over the last 4 months so the dashboard's
    -- income/expense chart and category breakdown have something to show ──
    INSERT INTO public.expenses (building_id, category, description, amount, spent_at, recorded_by) VALUES
        (v_building_id, 'Хигиенист', 'Месечно почистване на общите части', 65.00, CURRENT_DATE - INTERVAL '3 months', v_admin_id),
        (v_building_id, 'Градинар', 'Поддръжка на двора', 40.00, CURRENT_DATE - INTERVAL '3 months', v_admin_id),
        (v_building_id, 'Електричество', 'Ток за общите части', 28.00, CURRENT_DATE - INTERVAL '3 months', v_admin_id),
        (v_building_id, 'Хигиенист', 'Месечно почистване на общите части', 65.00, CURRENT_DATE - INTERVAL '2 months', v_admin_id),
        (v_building_id, 'Градинар', 'Поддръжка на двора', 40.00, CURRENT_DATE - INTERVAL '2 months', v_admin_id),
        (v_building_id, 'Ремонт', 'Поправка на счупен прозорец във входа', 95.00, CURRENT_DATE - INTERVAL '2 months', v_admin_id),
        (v_building_id, 'Хигиенист', 'Месечно почистване на общите части', 65.00, CURRENT_DATE - INTERVAL '1 month', v_admin_id),
        (v_building_id, 'Електричество', 'Ток за общите части', 31.00, CURRENT_DATE - INTERVAL '1 month', v_admin_id),
        (v_building_id, 'Хигиенист', 'Месечно почистване на общите части', 65.00, CURRENT_DATE, v_admin_id),
        (v_building_id, 'Градинар', 'Поддръжка на двора', 45.00, CURRENT_DATE, v_admin_id),
        (v_building_id, 'Ремонт на асансьора', 'Авариен ремонт на бутон за етаж', 109.00, CURRENT_DATE, v_admin_id),
        (v_building_id, 'Електрохолд', 'Ток за общите части', 24.00, CURRENT_DATE, v_admin_id);

    -- ── Maintenance issues ───────────────────────────────────────────────
    INSERT INTO public.maintenance_issues (building_id, unit_id, reported_by, title, description, status, priority, created_at, resolved_at) VALUES
        (v_building_id, v_unit_ids[3], v_admin_id, 'Не свети лампата на 2-ри етаж', 'Лампата в общото пространство на 2-ри етаж не работи от няколко дни.', 'open', 'normal', NOW() - INTERVAL '1 day', NULL),
        (v_building_id, v_unit_ids[6], v_admin_id, 'Счупен звънец', 'Домофонният звънец на апартамент 6 не работи.', 'resolved', 'low', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
        (v_building_id, NULL, v_admin_id, 'Скърцаща входна врата', 'Главната входна врата скърца силно, нужно е смазване на пантите.', 'open', 'low', NOW() - INTERVAL '2 hours', NULL);

    -- Inserted separately so we can capture its id for the demo comment below.
    INSERT INTO public.maintenance_issues (building_id, unit_id, reported_by, title, description, status, priority, created_at)
    VALUES (v_building_id, NULL, v_admin_id, 'Теч от покрива', 'При последния дъжд се появи влага на тавана на последния етаж.', 'in_progress', 'high', NOW() - INTERVAL '4 days')
    RETURNING id INTO v_issue_id;

    INSERT INTO public.maintenance_comments (issue_id, author_id, body)
    VALUES (v_issue_id, v_admin_id, 'Ще се свържа с майстор тази седмица.');

    RAISE NOTICE 'Seeded building % for % — invite code: %', v_building_id, v_admin_email, v_invite_code;
    RAISE NOTICE 'Units: 8. Fees: % + %. Expenses: 12. Announcements: 3. Poll: 1 (5 votes). Issues: 4.', v_period_prev, v_period_cur;
END $$;

-- ============================================================
-- CLEANUP — wipe this demo building to re-seed from scratch.
-- Uncomment and edit the email, then run on its own.
-- ============================================================
-- DO $$
-- DECLARE
--     v_email TEXT := 'YOUR_EMAIL_HERE@example.com';
--     v_uid UUID;
--     v_bid UUID;
-- BEGIN
--     SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
--     SELECT building_id INTO v_bid FROM public.building_members WHERE user_id = v_uid;
--     IF v_bid IS NOT NULL THEN
--         DELETE FROM public.buildings WHERE id = v_bid; -- cascades to everything else
--         RAISE NOTICE 'Deleted building % and all its data.', v_bid;
--     ELSE
--         RAISE NOTICE 'No building found for %.', v_email;
--     END IF;
-- END $$;
