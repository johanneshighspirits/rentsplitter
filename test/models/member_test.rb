require 'test_helper'

class MemberTest < ActiveSupport::TestCase

  test "should downcase email and create starter pattern based on first name on create" do
    member = Member.new(
      first_name: "Test", 
      last_name: "Testsson", 
      email: "nOtReaLly@DowNcA.Sed", 
      current_project_id: 1,
      password_digest: Member.digest('password'))
    member.save
    assert_equal "notreally@downca.sed", member.reload.email
    assert_equal "test", member.reload.pattern
  end

end
