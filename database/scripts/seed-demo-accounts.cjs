#!/usr/bin/env node
// Creates the two JA Hack 2026 jury demo accounts (an admin and a resident
// of the same building) and seeds realistic fee/payment/announcement/poll/
// expense/issue data for them — the JS-admin-API equivalent of
// seed-kingfloor-demo.sql, since that script assumes the accounts already
// exist (it can't create auth.users rows itself) and this one can, via
// supabase.auth.admin.createUser().
//
// Run once, from apps/web (so @supabase/supabase-js resolves):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node ../../database/scripts/seed-demo-accounts.cjs
//
// Safe to re-run: skips account creation if the email already exists, and
// skips building/data seeding if that account already belongs to one.

const {createClient} = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment first.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {auth: {autoRefreshToken: false, persistSession: false}})

const ADMIN_EMAIL = 'admin@kingfloor.com'
const RESIDENT_EMAIL = 'user@kingfloor.com'
// Supabase enforces a 6-character minimum — plain 'admin' (5 chars) is
// rejected with a weak_password error, so this pads it to the shortest
// valid superset of the requested password instead of silently picking
// something unrelated.
const PASSWORD = 'admin123'

async function findOrCreateUser(email, password) {
    // listUsers paginates; the jury accounts are created early so page 1 is enough in practice.
    const {data: list, error: listError} = await supabase.auth.admin.listUsers({page: 1, perPage: 200})
    if (listError) throw listError
    const existing = list.users.find((u) => u.email === email)
    if (existing) {
        console.log(`✓ ${email} already exists (${existing.id})`)
        return existing.id
    }
    const {data, error} = await supabase.auth.admin.createUser({email, password, email_confirm: true})
    if (error) throw error
    console.log(`✓ created ${email} (${data.user.id})`)
    return data.user.id
}

async function main() {
    const adminId = await findOrCreateUser(ADMIN_EMAIL, PASSWORD)
    const residentId = await findOrCreateUser(RESIDENT_EMAIL, PASSWORD)

    const {data: existingMembership} = await supabase
        .from('building_members')
        .select('building_id')
        .eq('user_id', adminId)
        .maybeSingle()
    if (existingMembership) {
        console.log(`${ADMIN_EMAIL} already belongs to a building (${existingMembership.building_id}) — not re-seeding. Delete that building first to reset.`)
        return
    }

    // Ensure profiles exist (the API/app normally creates these via a
    // handle_new_user trigger on signup — createUser via the admin API
    // still fires that same trigger, but upsert here too in case it
    // doesn't exist on this project, so display names aren't blank in the UI).
    await supabase.from('profiles').upsert([
        {id: adminId, username: 'admin_demo', display_name: 'Админ Демо'},
        {id: residentId, username: 'user_demo', display_name: 'Живущ Демо'},
    ], {onConflict: 'id', ignoreDuplicates: true})

    const {data: building, error: buildingError} = await supabase
        .from('buildings')
        .insert({name: 'Бл. 47, ж.к. Дружба 2', address: 'ул. Свети Наум 12, София', created_by: adminId})
        .select()
        .single()
    if (buildingError) throw buildingError
    const buildingId = building.id
    console.log(`✓ building ${buildingId}, invite code ${building.invite_code}`)

    const units = []
    for (let i = 1; i <= 8; i++) {
        const {data: unit, error} = await supabase
            .from('units')
            .insert({building_id: buildingId, number: String(i), floor: Math.ceil(i / 2), area_sqm: 58 + i * 5})
            .select()
            .single()
        if (error) throw error
        units.push(unit)
    }
    console.log(`✓ ${units.length} units`)

    // The buildings INSERT trigger already made adminId the building's
    // admin member with no unit — give the resident account unit 1.
    const {error: memberError} = await supabase
        .from('building_members')
        .insert({building_id: buildingId, user_id: residentId, role: 'resident', unit_id: units[0].id})
    if (memberError) throw memberError
    console.log(`✓ ${RESIDENT_EMAIL} joined as resident of unit ${units[0].number}`)

    const now = new Date()
    const periodPrev = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`.replace(/-00$/, `${now.getFullYear() - 1}-12`)
    const periodCur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const isoDaysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString()
    const isoDaysAhead = (d) => new Date(now.getTime() + d * 86400000).toISOString()
    const dateDaysAgo = (d) => isoDaysAgo(d).slice(0, 10)
    const dateDaysAhead = (d) => isoDaysAhead(d).slice(0, 10)

    for (let i = 0; i < units.length; i++) {
        const unit = units[i]

        const {data: prevFee, error: prevErr} = await supabase
            .from('fees')
            .insert({building_id: buildingId, unit_id: unit.id, period: periodPrev, amount: 45, due_date: dateDaysAgo(35), status: 'paid', paid_at: isoDaysAgo(20)})
            .select()
            .single()
        if (prevErr) throw prevErr
        await supabase.from('payments').insert({fee_id: prevFee.id, unit_id: unit.id, amount: 45, method: 'cash', recorded_by: adminId, paid_at: isoDaysAgo(20)})

        if ((i + 1) % 3 === 0) {
            // Unpaid with a due date already in the past — the app derives
            // "overdue" display state from this, never a literal DB status.
            await supabase.from('fees').insert({building_id: buildingId, unit_id: unit.id, period: periodCur, amount: 45, due_date: dateDaysAgo(5), status: 'unpaid'})
        } else if ((i + 1) % 2 === 0) {
            const {data: curFee, error: curErr} = await supabase
                .from('fees')
                .insert({building_id: buildingId, unit_id: unit.id, period: periodCur, amount: 45, due_date: dateDaysAhead(10), status: 'paid', paid_at: isoDaysAgo(2)})
                .select()
                .single()
            if (curErr) throw curErr
            await supabase.from('payments').insert({fee_id: curFee.id, unit_id: unit.id, amount: 45, method: 'bank_transfer', recorded_by: adminId, paid_at: isoDaysAgo(2)})
        } else {
            await supabase.from('fees').insert({building_id: buildingId, unit_id: unit.id, period: periodCur, amount: 45, due_date: dateDaysAhead(10), status: 'unpaid'})
        }
    }
    console.log(`✓ fees + payments for ${periodPrev} and ${periodCur}`)

    await supabase.from('announcements').insert([
        {building_id: buildingId, author_id: adminId, title: 'Годишно общо събрание', body: 'Каним всички собственици на общо събрание на 15-то число от месеца в 18:30 ч. във входа.', pinned: true, created_at: isoDaysAgo(2)},
        {building_id: buildingId, author_id: adminId, title: 'Почистване на двора', body: 'Фирмата за почистване ще обработи двора и общите части тази събота сутрин.', pinned: false, created_at: isoDaysAgo(5)},
        {building_id: buildingId, author_id: adminId, title: 'Нов график за извозване на отпадъци', body: 'От следващата седмица извозването е всеки вторник и петък вместо само в петък.', pinned: false, created_at: isoDaysAgo(9)},
    ])
    console.log('✓ 3 announcements')

    const {data: poll, error: pollError} = await supabase
        .from('polls')
        .insert({building_id: buildingId, created_by: adminId, title: 'Ремонт на асансьора', description: 'Основен ремонт на асансьора, прогнозна цена 1636 €, разпределена по идеални части.', status: 'open'})
        .select()
        .single()
    if (pollError) throw pollError
    const {data: options, error: optError} = await supabase
        .from('poll_options')
        .insert([
            {poll_id: poll.id, label: 'Да', position: 0},
            {poll_id: poll.id, label: 'Не', position: 1},
            {poll_id: poll.id, label: 'Без мнение', position: 2},
        ])
        .select()
    if (optError) throw optError
    const [yesOpt, noOpt, abstainOpt] = options
    await supabase.from('poll_votes').insert([
        {poll_id: poll.id, option_id: yesOpt.id, unit_id: units[0].id, user_id: residentId},
        {poll_id: poll.id, option_id: yesOpt.id, unit_id: units[1].id, user_id: adminId},
        {poll_id: poll.id, option_id: yesOpt.id, unit_id: units[2].id, user_id: adminId},
        {poll_id: poll.id, option_id: noOpt.id, unit_id: units[4].id, user_id: adminId},
        {poll_id: poll.id, option_id: abstainOpt.id, unit_id: units[5].id, user_id: adminId},
    ])
    console.log('✓ 1 poll, 5 votes')

    await supabase.from('expenses').insert([
        {building_id: buildingId, category: 'Хигиенист', description: 'Месечно почистване на общите части', amount: 65, spent_at: dateDaysAgo(90), recorded_by: adminId},
        {building_id: buildingId, category: 'Градинар', description: 'Поддръжка на двора', amount: 40, spent_at: dateDaysAgo(90), recorded_by: adminId},
        {building_id: buildingId, category: 'Електричество', description: 'Ток за общите части', amount: 28, spent_at: dateDaysAgo(90), recorded_by: adminId},
        {building_id: buildingId, category: 'Хигиенист', description: 'Месечно почистване на общите части', amount: 65, spent_at: dateDaysAgo(60), recorded_by: adminId},
        {building_id: buildingId, category: 'Градинар', description: 'Поддръжка на двора', amount: 40, spent_at: dateDaysAgo(60), recorded_by: adminId},
        {building_id: buildingId, category: 'Ремонт', description: 'Поправка на счупен прозорец във входа', amount: 95, spent_at: dateDaysAgo(60), recorded_by: adminId},
        {building_id: buildingId, category: 'Хигиенист', description: 'Месечно почистване на общите части', amount: 65, spent_at: dateDaysAgo(30), recorded_by: adminId},
        {building_id: buildingId, category: 'Електричество', description: 'Ток за общите части', amount: 31, spent_at: dateDaysAgo(30), recorded_by: adminId},
        {building_id: buildingId, category: 'Хигиенист', description: 'Месечно почистване на общите части', amount: 65, spent_at: dateDaysAgo(1), recorded_by: adminId},
        {building_id: buildingId, category: 'Градинар', description: 'Поддръжка на двора', amount: 45, spent_at: dateDaysAgo(1), recorded_by: adminId},
        {building_id: buildingId, category: 'Асансьор', description: 'Авариен ремонт на бутон за етаж', amount: 109, spent_at: dateDaysAgo(1), recorded_by: adminId},
        {building_id: buildingId, category: 'Електричество', description: 'Ток за общите части', amount: 24, spent_at: dateDaysAgo(1), recorded_by: adminId},
    ])
    console.log('✓ 12 expenses')

    await supabase.from('maintenance_issues').insert([
        {building_id: buildingId, unit_id: units[2].id, reported_by: residentId, title: 'Не свети лампата на 2-ри етаж', description: 'Лампата в общото пространство на 2-ри етаж не работи от няколко дни.', status: 'open', priority: 'normal', created_at: isoDaysAgo(1)},
        {building_id: buildingId, unit_id: units[5].id, reported_by: adminId, title: 'Счупен звънец', description: 'Домофонният звънец на апартамент 6 не работи.', status: 'resolved', priority: 'low', created_at: isoDaysAgo(10), resolved_at: isoDaysAgo(8)},
        {building_id: buildingId, unit_id: null, reported_by: adminId, title: 'Скърцаща входна врата', description: 'Главната входна врата скърца силно, нужно е смазване на пантите.', status: 'open', priority: 'low', created_at: isoDaysAgo(0)},
    ])
    const {data: issue} = await supabase
        .from('maintenance_issues')
        .insert({building_id: buildingId, unit_id: null, reported_by: residentId, title: 'Теч от покрива', description: 'При последния дъжд се появи влага на тавана на последния етаж.', status: 'in_progress', priority: 'high', created_at: isoDaysAgo(4)})
        .select()
        .single()
    await supabase.from('maintenance_comments').insert({issue_id: issue.id, author_id: adminId, body: 'Ще се свържа с майстор тази седмица.'})
    console.log('✓ 4 maintenance issues + 1 comment')

    console.log('\nDone. Jury login:')
    console.log(`  Admin:    ${ADMIN_EMAIL} / ${PASSWORD}`)
    console.log(`  Resident: ${RESIDENT_EMAIL} / ${PASSWORD}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
