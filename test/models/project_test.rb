require 'test_helper'

class ProjectTest < ActiveSupport::TestCase

  test "all member's projects' names should be unique" do
    @member = members(:member)
    p_name = "My not unique Project"
    assert_difference 'Project.count', 1 do
      @member.projects.create(
        name: p_name,
        admin_id: @member.id
      )
    end
    assert !@member.projects.find_by(name: p_name).nil?

    # Add project with same name
    assert_difference 'Project.count', 0 do
      @member.projects.create(
        name: p_name,
        admin_id: @member.id
      )
    end

    p @member.projects
  end

  test "project must be associated with a membership" do
    
  end
  
end
