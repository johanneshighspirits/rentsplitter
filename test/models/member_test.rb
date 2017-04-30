require 'test_helper'

class MemberTest < ActiveSupport::TestCase

  test "should downcase email and create starter pattern on create" do
    member = Member.new(name: "Test", email: "nOtReaLly@DowNcA.Sed", password_digest: Member.digest('password'))
    member.save
    assert_equal "notreally@downca.sed", member.reload.email
    assert_equal "test", member.reload.pattern
  end

  test "should destroy all member transactions on delete" do
    @member = Member.new(name: "Will B. Deleted", email: "valid@email.com", password_digest: Member.digest('password'))
    @member.save
    assert_difference 'Project.count', 1 do
      @member.projects.create!(name: "TestProject")
    end
    assert_difference 'Transaction.count', 1 do
      @member.transactions.create(amount: 123, message: "message", date: Time.zone.now)
    end
    assert_difference 'Transaction.count', -1 do
      @member.destroy
    end
  end

end
