require 'test_helper'

class InvitationsTest < ActionDispatch::IntegrationTest
  include SessionsHelper

  test "valid invitation should log member in, activate member and redirect to root" do
    member = members(:member_invited_unactivated)
    assert !member.activated?
    member.invitation_token = Member.new_token
    member.invitation_digest = Member.digest(member.invitation_token)
    member.save
    # Member follows email invitation link
    get edit_invitation_url(member.invitation_token, email: member.email)
    
    assert_redirected_to edit_member_path(member, first: true)
    follow_redirect!
    assert_response :success
    assert current_member?(member), "Member should be logged in"
    # Enter new password
    patch member_path(member), params: {
      member: {
        password: 'new_password',
        password_confirmation: 'new_password'
      }
    }
    assert_redirected_to root_path
    follow_redirect!
    assert member.reload.activated?
    assert_template 'application/index'
  end

  test "valid invitation should log activated member in, and redirect to root" do
    member = members(:member_activated)
    assert member.activated?
    member.invitation_token = Member.new_token
    member.invitation_digest = Member.digest(member.invitation_token)
    member.save
    # Member follows email invitation link
    get edit_invitation_url(member.invitation_token, email: member.email)
    assert_redirected_to login_path
    follow_redirect!
    # Login
    post login_path, params: {
      session: {
        email: member.email,
        password: 'password'
      }
    }
    assert_redirected_to root_path
    follow_redirect!
    assert_response :success
    assert current_member?(member), "Member should be logged in"
    assert member.reload.activated?
    assert_template 'application/index'
  end

end
