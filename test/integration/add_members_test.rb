require 'test_helper'

class AddMembersTest < ActionDispatch::IntegrationTest

  def setup
    @admin = members(:admin)
    @member = members(:member)
    random_pass = Member.new_token
    @valid_new_member = {
      name: "MemberWithoutProjectName",
      email: "MemberWithout@Project.Name",
      password: random_pass,
      password_confirmation: random_pass
    }
    @valid_new_member2 = {
      name: "AnotherMemberWithoutProjectName",
      email: "AnotherMemberWithout@Project.Name",
      password: random_pass,
      password_confirmation: random_pass
    }
  end

  test "only admin can add members" do
    get new_member_path
    assert_redirected_to login_path
    follow_redirect!
    assert_response :success

    log_in_as @member
    get new_member_path
    assert_redirected_to root_path
    follow_redirect!
    assert_response :success
    log_out

    log_in_as @admin
    get new_member_path
    assert_response :success
    assert_template 'members/new'
  end

  test "must assign project to new member" do
    log_in_as @admin
    get new_member_path

    # Check that no member or project is created when no project is
    # selected and no new name is entered
    assert_difference ['Member.count', 'Project.count'], 0 do
      post members_path, params: {
        joined_at_y: 2000,
        joined_at_m: 1,
        left_at_y: 2020,
        left_at_m: 7,
        member: @valid_new_member
      }
    end
    assert_template "members/new"
    assert_match /Enter a name for a new Project or choose an existing one/, response.body

    # Check that no member or project is created when new project is
    # selected but no name entered
    assert_difference ['Member.count', 'Project.count'], 0 do
      post members_path, params: {
        new_or_existing: "new",
        joined_at_y: 2000,
        joined_at_m: 1,
        left_at_y: 2020,
        left_at_m: 7,
        member: @valid_new_member,
        project: { name: "" },
      }
    end
    assert_template "members/new"
    assert_match /Enter a name for a new Project or choose an existing one/, response.body

    # Check that member IS created when existing project is
    # selected. Project.count should not change  
    project_count = Project.count
    assert_difference 'Member.count', 1 do
      post members_path, params: {
        new_or_existing: "existing",
        project: { name: "" },
        project_id: 839719613,
        joined_at_y: 2000,
        joined_at_m: 1,
        left_at_y: 2020,
        left_at_m: 7,
        member: @valid_new_member
      }
    end
    assert project_count == Project.count
    assert_redirected_to root_path
    follow_redirect!
    assert_match /Invitation email sent to/, response.body

    # Check that member AND rent AND project IS created when new project is
    # properly entered and selected. 
    project_name = "New Project Name"
    get new_member_path
    assert_response :success
    assert_difference ['Member.count', 'Project.count', 'Rent.count'], 1 do
      post members_path, params: {
        new_or_existing: "new",
        project: {
          name: project_name,
          start_date: 5.years.ago.beginning_of_month
        },
        project_id: "",
        joined_at_y: 2000,
        joined_at_m: 1,
        left_at_y: 2020,
        left_at_m: 7,
        member: @valid_new_member2
      }
    end
    assert_redirected_to root_path
    follow_redirect!
    assert_match /Invitation email sent to/, response.body
    # Is project valid?
    new_project = Project.find_by(name: project_name)
    new_member = Member.find_by(name: @valid_new_member2[:name])
    assert_equal 5.years.ago.beginning_of_month, new_project.start_date
    assert_equal project_name, new_project.name
    # Make sure admin_id was set
    assert_equal new_member.id, new_project.admin_id
  end


  test "valid member should be saved to database" do
  end

  test "invalid member should not be saved" do
  end

end
