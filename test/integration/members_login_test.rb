require 'test_helper'

class MembersLoginTest < ActionDispatch::IntegrationTest

  def setup
    @admin = members(:admin)
    @member = members(:member)
  end

  test "show login screen if not logged in" do
    get root_path
    assert_redirected_to login_path
    follow_redirect!
    assert_select 'h3', /Log in/
  end

  test "show 'Logged in as member.name' if logged in" do
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
    assert_select 'p', "Logged in as #{@member.name}"
  end

  test "should be redirected to wanted page when logging in" do
    get projects_path
    assert_redirected_to login_path
    post login_path, params: {
      session: {
        email: @member.email,
        password: 'password'
      }
    }
    assert_redirected_to projects_path
    follow_redirect!
    assert_template 'projects/index'
  end

  test "should open latest project on successful login" do
    # Log in as member
    get login_path
    log_in_as @member
    assert_equal 820312697, @member.id
    assert_redirected_to root_url
    follow_redirect!
    assert_template 'application/index'
    assert_equal 839719613, session[:project_id]
  end


  test "should not show new members page to non-site-admin" do
    get members_path
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
    assert_redirected_to members_path
    follow_redirect!
    assert_redirected_to root_path
    follow_redirect!
    get members_path
    assert_redirected_to root_path
  end

  test "show members page to logged in project admin" do
    # Log in as admin
    get login_path
    post login_path, params: {
      session: {
        email: @admin.email,
        password: 'password'
      }
    }
    assert_redirected_to root_path
    follow_redirect!
    get members_path
    assert_response :success
    assert_template 'members/index'
    assert_select 'a', 'Delete'
  end

end
