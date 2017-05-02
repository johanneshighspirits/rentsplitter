require 'test_helper'

class TransfersTest < ActionDispatch::IntegrationTest

  def setup
    @admin = members(:admin)
    @member = members(:member)
  end

  test "should save valid transfer" do
    # log in as admin
    log_in_as @admin
    get new_transfer_path
    assert_response :success
    assert_difference 'Transfer.count', 1 do
      post transfers_path, params: {
        member_id: @member.id,
        transfer: {
          amount: 250.0,
          message: "example0 rent for June",
          date: Time.zone.now.to_date
        }
      }
    end
  end

  test "should save multiple transfers at once if admin" do
    # not logged_in
    get new_transfer_path
    assert_redirected_to login_path
    follow_redirect!
    assert_template 'sessions/new'
    # log in as member
    log_in_as @member
    get new_transfer_path
    assert_redirected_to root_path
    follow_redirect!
    assert_template 'application/index'
    log_out
    # log in as admin
    log_in_as @admin
    get new_transfer_path
    assert_response :success
    transfers = [
      {
        transfer: {
          amount: 250.0,
          message: "Mr. Administrators pay",
          date: Time.zone.now.to_date
        }
      },
      {
        transfer: {
          amount: 123.5,
          message: "Juli mEmBerr",
          date: Time.zone.now
        },
      }
    ]
    assert_difference 'Transfer.count', 2 do
      post transfers_many_path, params: { transfers: transfers }
    end
  end

end
