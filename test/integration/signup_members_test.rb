require 'test_helper'

class SignupMembersTest < ActionDispatch::IntegrationTest

  test "valid signup should show activation screen and send email for not logged in user" do
    # Try when not logged in
    get signup_path
    post signup_path params: {
      member: {
        name: "Bertil",
        email: "bertil@bertil.com",
        password: "bertil",
        password_confirmation: "bertil",
      }
    }
    assert_template 'members/activate'
    assert_response :success
    assert_select "h1", "Welcome Bertil!"
    # Paste valid activation link and submit form
    member = Member.find_by(email: "bertil@bertil.com")
    member.invitation_token = Member.new_token
    member.invitation_digest = Member.digest(member.invitation_token)
    member.save
    # Member clicks on email activation link
    link = edit_invitation_url(member.invitation_token, email: member.email)

    post activate_path params: {
      activation_link: link
    }
    assert_redirected_to link
    follow_redirect!
    assert is_logged_in?
    puts "Logged in"
    assert_redirected_to edit_member_path member
    follow_redirect!
    assert_template 'members/welcome'
    assert_select "h1", "Welcome Bertil!"
  end

  test "valid signup should log out current member and log in new" do
    # Log in
    log_in_as members(:member)
    get signup_path
    post signup_path params: {
      member: {
        name: "Bertil2",
        email: "bertil2@bertil.com",
        password: "bertil2",
        password_confirmation: "bertil2",
      }
    }
    assert_template 'members/activate'
    assert_response :success
    assert_select "h1", "Welcome Bertil2!"
    # Paste valid activation link and submit form
    member = Member.find_by(email: "bertil2@bertil.com")
    member.invitation_token = Member.new_token
    member.invitation_digest = Member.digest(member.invitation_token)
    member.save
    # Member follows email activation link
    link = edit_invitation_url(member.invitation_token, email: member.email)
    get link
    assert is_logged_in?
    assert_equal session[:member_id], member.reload.id
    assert_redirected_to edit_member_path member
    follow_redirect!
    assert_template 'members/welcome'
    assert_select "h1", "Welcome Bertil2!"
  end

  
  

end
