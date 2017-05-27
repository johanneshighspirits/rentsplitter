require 'rails_helper'

feature "Member visits home page" do
  after(:each) do |example|
    if example.exception
      puts "DESTROY member here?"
    end
  end
  scenario "while not logged in", js: true do
    visit '/'
    # Should be redirected to login
    expect(page).to have_css 'h1', text: 'RentSplitter'
    expect(page).to have_css 'h3', text: 'Log in'
  end
  scenario "and logs in successfully", js: true do
    member = create(:member, :activated)
    visit '/'
    expect(page).to have_css 'h3', text: 'Log in'
    fill_in "Email", with: member.email
    fill_in "Password", with: "password"
    click_on "Log in"
    # Should be logged in and redirected to root
    expect(page).to have_css 'p', text: "Logged in as #{member.name}"
    member.destroy
  end

end
