require 'test_helper'

class MemberTest < ActiveSupport::TestCase

  test "should downcase email and create starter pattern on create" do
    member = Member.new(
      name: "Test", 
      email: "nOtReaLly@DowNcA.Sed", 
      current_project_id: 1,
      password_digest: Member.digest('password'))
    member.save
    assert_equal "notreally@downca.sed", member.reload.email
    assert_equal "test", member.reload.pattern
  end

  test "should have current_project_id when created" do
    # Set current_project_id to 0 for members without project association
    member = Member.create(name: "MemberWithoutProject", email: "memW@ber.com", password_digest: Member.digest('password'))
    assert_equal 0, member.reload.current_project_id

    assert_difference ['Member.count', 'Project.count'], 1 do
      member = Member.new(name: "MemberWithProject", email: "mem@ber.com", password_digest: Member.digest('password'))
      new_p = member.projects.build(name: "A new Project")
      member.save
      new_project_id = new_p.id
      # current_project_id should not be nil
      assert_not member.reload.current_project_id.nil?
      assert_equal member.reload.current_project_id, new_project_id
    end
  end

end
