# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)
members = Member.create(
    name: "ADMIN Member",
    email: "email@example.com",
    password_digest: Member.digest("password"),
    activated: true,
    admin: true
  )

5.times do |n|
  member = Member.create(
    name: "Member #{n}",
    email: "email#{n}@example.com",
    password_digest: Member.digest("password"),
    activated: true
  )
end