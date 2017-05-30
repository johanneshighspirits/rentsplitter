# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170530143133) do

  create_table "members", force: :cascade do |t|
    t.string   "email"
    t.datetime "created_at",                         null: false
    t.datetime "updated_at",                         null: false
    t.boolean  "activated",          default: false
    t.string   "password_digest"
    t.string   "invitation_digest"
    t.boolean  "admin",              default: false
    t.string   "remember_digest"
    t.string   "pattern"
    t.integer  "current_project_id"
    t.boolean  "invited",            default: false
    t.string   "first_name"
    t.string   "last_name"
    t.string   "reset_digest"
    t.datetime "reset_sent_at"
  end

  create_table "memberships", force: :cascade do |t|
    t.integer  "member_id"
    t.integer  "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.date     "joined_at"
    t.date     "left_at"
    t.index ["member_id"], name: "index_memberships_on_member_id"
    t.index ["project_id"], name: "index_memberships_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at",   null: false
    t.datetime "updated_at",   null: false
    t.date     "start_date"
    t.integer  "admin_id"
    t.string   "info"
    t.string   "account_info"
  end

  create_table "rent_discounts", force: :cascade do |t|
    t.decimal  "amount"
    t.string   "message"
    t.date     "transferred_at"
    t.integer  "project_id"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
    t.index ["message", "amount", "transferred_at"], name: "index_rent_discounts_on_message_and_amount_and_transferred_at", unique: true
    t.index ["project_id"], name: "index_rent_discounts_on_project_id"
  end

  create_table "rents", force: :cascade do |t|
    t.date     "due_date"
    t.decimal  "amount"
    t.integer  "project_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_rents_on_project_id"
  end

  create_table "transfers", force: :cascade do |t|
    t.decimal  "amount"
    t.string   "message"
    t.date     "transferred_at"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
    t.integer  "membership_id"
    t.index ["membership_id"], name: "index_transfers_on_membership_id"
    t.index ["message", "amount", "transferred_at", "membership_id"], name: "transfers_unique_index", unique: true
  end

end
