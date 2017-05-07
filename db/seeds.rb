# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)
admin = Member.new(
    name: "ADMIN Member",
    email: "email@example.com",
    password_digest: Member.digest("password"),
    pattern: "admin",
    activated: true,
    admin: true
  )
# admin.projects.build(
#   name: "Project Nr ONE",
#   start_date: Date.current.beginning_of_month
# )
admin.save

5.times do |n|
  member = Member.new(
    name: "Member #{n}",
    email: "email#{n}@example.com",
    password_digest: Member.digest("password"),
    pattern: "member #{n}",
    activated: true
  )
  # member.projects.build(
  #   name: "Project #{n}",
  #   start_date: Date.current.beginning_of_month
  # )
  member.save
end
