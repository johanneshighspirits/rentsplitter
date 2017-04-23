require 'test_helper'

class MembersLoginTest < ActionDispatch::IntegrationTest

  def setup
    @admin = members(:admin)
    @member = members(:member)
  end

  test "only show index page to logged in members" do
    # try when logged out first
    get root_path
    assert_select 'p', /You need a special invitation to see this page/
    # Log in as member
    get login_path
    assert_template 'sessions/new'
    post login_path, params: {
      session: {
        email: @member.email,
        password: 'password'
      }
    }
    assert_redirected_to root_url
    follow_redirect!
    assert_template 'application/index'
    assert_select 'h1', 'RentSplitter'
  end

  test "should not show new member page to non-admin" do
    get new_member_path
    assert_redirected_to login_path
    follow_redirect!
    assert_template 'sessions/new'
    # Login as non-admin member
    post login_path, params: {
      session: {
        email: @member.email,
        password: 'password'
      }
    }
    assert_redirected_to root_path
    get new_member_path
    assert_redirected_to root_path
    
  end

  test "show members page to logged in admin" do
    # try when logged out first
    get members_path
    assert_redirected_to login_path
    follow_redirect!
    assert_template 'sessions/new'
    assert_select 'h1', /Log in/
    # Log in as admin
    post login_path, params: {
      session: {
        email: @admin.email,
        password: 'password'
      }
    }
    assert_redirected_to members_path
    follow_redirect!
    assert_template 'members/index'
    assert_select 'a', 'Delete'
  end

  test "should create new member if admin" do
    log_in_as @admin
    get new_member_path
    random_pass = Member.new_token
    assert_difference 'Member.count', 1 do
      #create member
      post members_path, params: {
        member: {
          name: "Example User",
          email: "email@example.com",
          password: random_pass,
          password_confirmation: random_pass
        }
      }
    end
  end

end
