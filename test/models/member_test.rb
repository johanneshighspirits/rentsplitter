require 'test_helper'

class MemberTest < ActiveSupport::TestCase

  test "should downcase email and create starter pattern on create" do
    member = Member.new(name: "Test", email: "nOtReaLly@DowNcA.Sed", password_digest: Member.digest('password'))
    member.save
    assert_equal "notreally@downca.sed", member.reload.email
    assert_equal "test", member.reload.pattern
  end

end
